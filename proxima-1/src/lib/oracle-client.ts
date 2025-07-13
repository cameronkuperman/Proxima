import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ConversationService } from './supabase-conversations';
import { LLMContextService } from './supabase-llm-context';

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export interface OracleMessage {
  query: string;
  user_id: string;
  conversation_id: string;
  category?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface OracleResponse {
  response: string | Record<string, any>;
  raw_response: string;
  conversation_id: string;
  user_id: string;
  category: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface SummaryResponse {
  summary: string;
  token_count: number;
  compression_ratio: number;
  status: 'success' | 'error';
  error?: string;
}

export class OracleClient {
  private baseUrl: string;
  private defaultRetries: number = 3;
  private defaultTimeout: number = 30000; // 30 seconds
  private conversationCreated: Map<string, boolean> = new Map();
  private messagesInConversation: Map<string, number> = new Map();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a message to Oracle and get a response
   */
  async sendMessage(
    query: string,
    userId: string,
    conversationId?: string,
    options?: {
      category?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      retries?: number;
      isFirstMessage?: boolean;
    }
  ): Promise<OracleResponse> {
    // Generate conversation ID if not provided
    const convId = conversationId || uuidv4();
    
    // Create conversation in Supabase if this is the first message
    if (options?.isFirstMessage && !this.conversationCreated.get(convId)) {
      const conversation = await ConversationService.createConversation(
        userId,
        convId,
        await ConversationService.generateTitle(query),
        'openrouterai',
        options?.model || 'tngtech/deepseek-r1t-chimera:free',
        'health_analysis'
      );
      
      if (conversation) {
        this.conversationCreated.set(convId, true);
        
        // Add the user's first message to Supabase
        await ConversationService.addMessage(
          convId,
          'user',
          query,
          { source: 'oracle_chat' }
        );
      }
    } else if (!options?.isFirstMessage) {
      // Add subsequent user messages
      await ConversationService.addMessage(
        convId,
        'user',
        query,
        { source: 'oracle_chat' }
      );
    }
    
    const message: OracleMessage = {
      query,
      user_id: userId,
      conversation_id: convId,
      category: options?.category || 'health-scan',
      model: options?.model,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens
    };

    const retries = options?.retries || this.defaultRetries;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.post<OracleResponse>(
          `${this.baseUrl}/api/chat`,
          message,
          {
            timeout: this.defaultTimeout,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        // Store the assistant's response in Supabase
        const responseData = response.data;
        await ConversationService.addMessage(
          convId,
          'assistant',
          typeof responseData.response === 'string' 
            ? responseData.response 
            : JSON.stringify(responseData.response),
          {
            token_count: responseData.usage.total_tokens,
            model_used: responseData.model,
            processing_time: Date.now() - startTime,
            source: 'oracle_chat'
          }
        );

        // Track that we have messages in this conversation
        const currentCount = this.messagesInConversation.get(convId) || 0;
        this.messagesInConversation.set(convId, currentCount + 2); // user + assistant

        return responseData;
      } catch (error) {
        if (attempt === retries) {
          throw this.handleError(error);
        }
        // Exponential backoff
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }

    throw new Error('Failed after all retries');
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string): Promise<string> {
    const newId = uuidv4();
    // Reset tracking for new conversation
    this.conversationCreated.set(newId, false);
    this.messagesInConversation.set(newId, 0);
    return newId;
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`);
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Generate a summary for a conversation
   */
  async generateSummary(
    conversationId: string,
    userId: string
  ): Promise<SummaryResponse> {
    // Don't even try if we haven't created a conversation or have no messages
    const messageCount = this.messagesInConversation.get(conversationId) || 0;
    if (!this.conversationCreated.get(conversationId) || messageCount === 0) {
      return {
        summary: '',
        token_count: 0,
        compression_ratio: 0,
        status: 'error',
        error: 'No conversation to summarize'
      };
    }

    try {
      const response = await axios.post<SummaryResponse>(
        `${this.baseUrl}/api/generate_summary`,
        {
          conversation_id: conversationId,
          user_id: userId
        },
        {
          timeout: this.defaultTimeout,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Store summary in both conversation metadata and llm_context table
      if (response.data.status === 'success') {
        // Update conversation metadata
        await ConversationService.updateConversation(conversationId, {
          metadata: {
            last_summary: response.data.summary,
            summary_generated_at: new Date().toISOString(),
            summary_token_count: response.data.token_count,
            summary_compression_ratio: response.data.compression_ratio
          }
        });

        // Store in llm_context table for Oracle backend to use
        await LLMContextService.storeSummary(
          userId,
          conversationId,
          response.data.summary,
          response.data.token_count,
          response.data.compression_ratio
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error
        return new Error(`Oracle API Error: ${error.response.status} - ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        // No response received
        return new Error('Oracle API is not responding. Please check if the server is running.');
      }
    }
    return new Error('An unexpected error occurred');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const oracleClient = new OracleClient();