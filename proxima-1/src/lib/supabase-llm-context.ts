import { supabase } from './supabase';

export interface LLMContext {
  id: string;
  user_id: string;
  conversation_id: string;
  context_type: string;
  content: string;
  token_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class LLMContextService {
  /**
   * Store a conversation summary in the llm_context table
   */
  static async storeSummary(
    userId: string,
    conversationId: string,
    summary: string,
    tokenCount: number,
    compressionRatio: number
  ): Promise<LLMContext | null> {
    try {
      // First, check if a summary already exists for this conversation
      const { data: existing, error: fetchError } = await supabase
        .from('llm_context')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('context_type', 'conversation_summary')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing summary:', fetchError);
        return null;
      }

      // If summary exists, update it
      if (existing) {
        const { data, error } = await supabase
          .from('llm_context')
          .update({
            content: summary,
            token_count: tokenCount,
            metadata: {
              compression_ratio: compressionRatio,
              generated_at: new Date().toISOString(),
              source: 'oracle_chat'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating summary:', error);
          return null;
        }

        return data;
      }

      // Otherwise, create new summary
      const { data, error } = await supabase
        .from('llm_context')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          context_type: 'conversation_summary',
          content: summary,
          token_count: tokenCount,
          metadata: {
            compression_ratio: compressionRatio,
            generated_at: new Date().toISOString(),
            source: 'oracle_chat'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error storing summary:', error);
      return null;
    }
  }

  /**
   * Get all summaries for a user
   */
  static async getUserSummaries(userId: string): Promise<LLMContext[]> {
    try {
      const { data, error } = await supabase
        .from('llm_context')
        .select('*')
        .eq('user_id', userId)
        .eq('context_type', 'conversation_summary')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user summaries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching summaries:', error);
      return [];
    }
  }

  /**
   * Get summary for a specific conversation
   */
  static async getConversationSummary(conversationId: string): Promise<LLMContext | null> {
    try {
      const { data, error } = await supabase
        .from('llm_context')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('context_type', 'conversation_summary')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No summary found
          return null;
        }
        console.error('Error fetching conversation summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching summary:', error);
      return null;
    }
  }

  /**
   * Delete a conversation summary
   */
  static async deleteSummary(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('llm_context')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('context_type', 'conversation_summary');

      if (error) {
        console.error('Error deleting summary:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting summary:', error);
      return false;
    }
  }

  /**
   * Get aggregated context for a user (when total tokens > 25k)
   */
  static async getAggregatedContext(userId: string): Promise<string | null> {
    try {
      const summaries = await this.getUserSummaries(userId);
      
      if (summaries.length === 0) {
        return null;
      }

      // Aggregate all summaries with timestamps
      const aggregated = summaries
        .map(summary => {
          const date = new Date(summary.updated_at).toLocaleDateString();
          return `[${date}] ${summary.content}`;
        })
        .join('\n\n---\n\n');

      return aggregated;
    } catch (error) {
      console.error('Error getting aggregated context:', error);
      return null;
    }
  }
}