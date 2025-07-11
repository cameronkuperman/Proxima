import { useState, useEffect } from 'react';
import { ConversationService, Conversation } from '@/lib/supabase-conversations';

export function useConversationHistory(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userConversations = await ConversationService.getUserConversations(userId);
        setConversations(userConversations);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [userId]);

  const refreshConversations = async () => {
    if (!userId) return;
    
    try {
      const userConversations = await ConversationService.getUserConversations(userId);
      setConversations(userConversations);
    } catch (err) {
      setError(err as Error);
      console.error('Error refreshing conversations:', err);
    }
  };

  return {
    conversations,
    isLoading,
    error,
    refreshConversations
  };
}