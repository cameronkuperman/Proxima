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
  reasoning_mode?: boolean;
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
    reasoning_tokens?: number;
    response_tokens?: number;
  };
  model: string;
  model_used?: string;
  tier?: string;
  reasoning_mode?: boolean;
  has_reasoning?: boolean;
  reasoning?: string;
  message?: string;
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
      reasoningMode?: boolean;
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
      max_tokens: options?.maxTokens,
      reasoning_mode: options?.reasoningMode
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
        
        // Debug log the raw response
        console.log('[OracleClient] Raw API response:', response.data);
        console.log('[OracleClient] Request payload was:', message);

        // Store the assistant's response in Supabase
        const responseData = response.data;
        await ConversationService.addMessage(
          convId,
          'assistant',
          typeof responseData.response === 'string' 
            ? responseData.response 
            : JSON.stringify(responseData.response),
          {
            token_count: responseData.usage?.total_tokens || 0,
            model_used: responseData.model,
            processing_time: Date.now() - startTime,
            source: 'oracle_chat',
            reasoning: responseData.reasoning,
            reasoning_tokens: responseData.usage?.reasoning_tokens,
            reasoning_mode: responseData.reasoning_mode,
            has_reasoning: responseData.has_reasoning || false
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
   * Stream a message (SSE or chunked) if backend supports it
   * Falls back to non-streaming when not available.
   */
  async streamMessage(
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
      reasoningMode?: boolean;
    },
    callbacks?: {
      onStart?: (convId: string) => void;
      onReasoningDelta?: (text: string) => void;
      onContentDelta?: (text: string) => void;
      onDone?: (finalText: string) => void;
    }
  ): Promise<OracleResponse | null> {
    // Gate by env so we don't call a route that may not exist
    if (process.env.NEXT_PUBLIC_ORACLE_STREAMING !== 'true') {
      return null;
    }

    const convId = conversationId || uuidv4();

    // Create conversation if needed (mirrors sendMessage logic)
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

    callbacks?.onStart?.(convId);

    const payload: OracleMessage = {
      query,
      user_id: userId,
      conversation_id: convId,
      category: options?.category || 'health-scan',
      model: options?.model,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      reasoning_mode: options?.reasoningMode
    };

    const endpoint = `${this.baseUrl}/api/chat/stream`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.body) {
        return null; // fall back to non-streaming
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let reasoningAccum = '';

      // We accept either server-sent events with lines starting with 'data:'
      // or raw JSONL where each line is a JSON object with {type, delta, done}
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split(/\n/).filter(Boolean);
        for (const line of lines) {
          const content = line.startsWith('data:') ? line.slice(5).trim() : line.trim();
          if (!content) continue;
          try {
            const data = JSON.parse(content);
            if (data.type === 'reasoning' && data.delta) {
              reasoningAccum += data.delta;
              callbacks?.onReasoningDelta?.(data.delta);
            } else if (data.type === 'content' && data.delta) {
              accumulated += data.delta;
              callbacks?.onContentDelta?.(data.delta);
            } else if (data.done) {
              callbacks?.onDone?.(accumulated);
            }
          } catch {
            // Treat as plain text delta
            accumulated += content;
            callbacks?.onContentDelta?.(content);
          }
        }
      }

      // After stream completes, persist assistant message
      const responseData: OracleResponse = {
        response: accumulated,
        raw_response: accumulated,
        conversation_id: convId,
        user_id: userId,
        category: payload.category || 'health-scan',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: options?.model || 'unknown',
        has_reasoning: !!reasoningAccum,
        reasoning: reasoningAccum || undefined,
        reasoning_mode: options?.reasoningMode
      };

      await ConversationService.addMessage(convId, 'assistant', accumulated, {
        token_count: 0,
        model_used: responseData.model,
        source: 'oracle_chat',
        reasoning: reasoningAccum || undefined,
        reasoning_mode: options?.reasoningMode,
        has_reasoning: !!reasoningAccum
      });

      const currentCount = this.messagesInConversation.get(convId) || 0;
      this.messagesInConversation.set(convId, currentCount + 2);

      return responseData;
    } catch (error) {
      console.error('Streaming failed:', error);
      return null;
    }
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