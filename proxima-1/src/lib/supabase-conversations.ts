import { supabase } from './supabase';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  ai_provider: string;
  model_name: string;
  conversation_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  message_count: number;
  total_tokens: number;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type: string;
  token_count: number;
  model_used?: string;
  processing_time?: number;
  attachments: any[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class ConversationService {
  /**
   * Create a new conversation in Supabase
   */
  static async createConversation(
    userId: string,
    conversationId: string,
    title: string = 'Oracle Health Chat',
    aiProvider: string = 'openrouterai',
    modelName: string = 'tngtech/deepseek-r1t-chimera:free',
    conversationType: string = 'health_analysis'
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: userId,
          title,
          ai_provider: aiProvider,
          model_name: modelName,
          conversation_type: conversationType,
          status: 'active',
          message_count: 0,
          total_tokens: 0,
          metadata: {
            source: 'oracle_chat',
            version: '1.0'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error creating conversation:', error);
      return null;
    }
  }

  /**
   * Get an existing conversation
   */
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error getting conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error getting conversation:', error);
      return null;
    }
  }

  /**
   * Update conversation (e.g., title, status, tokens)
   */
  static async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating conversation:', error);
      return null;
    }
  }

  /**
   * Add a message to the conversation
   */
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: {
      token_count?: number;
      model_used?: string;
      processing_time?: number;
      [key: string]: any;
    }
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          content_type: 'text',
          token_count: metadata?.token_count || 0,
          model_used: metadata?.model_used,
          processing_time: metadata?.processing_time,
          attachments: [],
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      // Update conversation token count if provided
      if (metadata?.token_count) {
        const conversation = await this.getConversation(conversationId);
        if (conversation) {
          await this.updateConversation(conversationId, {
            total_tokens: conversation.total_tokens + metadata.token_count
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Unexpected error adding message:', error);
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error getting messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error getting messages:', error);
      return [];
    }
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(
    userId: string,
    status: string = 'active'
  ): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error getting user conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);

      if (error) {
        console.error('Error archiving conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error archiving conversation:', error);
      return false;
    }
  }

  /**
   * Delete a conversation (soft delete - changes status)
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'deleted' })
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Generate a title for the conversation based on first user message
   */
  static async generateTitle(content: string): Promise<string> {
    // Simple title generation - take first 50 chars or first sentence
    const firstSentence = content.match(/^[^.!?]+/)?.[0] || content;
    const title = firstSentence.slice(0, 50).trim();
    return title.length < firstSentence.length ? title + '...' : title;
  }
}