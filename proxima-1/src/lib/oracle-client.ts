import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ConversationService } from './supabase-conversations';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export class OracleClient {
  private baseUrl: string;
  private defaultRetries: number = 3;
  private defaultTimeout: number = 30000; // 30 seconds
  private conversationCreated: Map<string, boolean> = new Map();

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
    return uuidv4();
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