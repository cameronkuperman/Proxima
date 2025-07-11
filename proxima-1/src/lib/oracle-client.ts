import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

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
    }
  ): Promise<OracleResponse> {
    // Generate conversation ID if not provided
    const convId = conversationId || uuidv4();
    
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

        return response.data;
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