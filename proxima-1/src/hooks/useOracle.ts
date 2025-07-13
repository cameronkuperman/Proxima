import { useState, useCallback, useRef, useEffect } from 'react';
import { oracleClient, OracleResponse, SummaryResponse } from '@/lib/oracle-client';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Record<string, any>;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
  };
}

export interface UseOracleOptions {
  userId: string;
  conversationId?: string;
  onError?: (error: Error) => void;
  onSuccess?: (response: OracleResponse) => void;
}

export function useOracle({
  userId,
  conversationId: initialConversationId,
  onError,
  onSuccess
}: UseOracleOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId || ''
  );
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  // Initialize conversation ID
  useEffect(() => {
    if (!conversationId) {
      oracleClient.createConversation(userId).then(setConversationId);
    }
  }, [conversationId, userId]);

  // Check server health on mount
  useEffect(() => {
    oracleClient.checkHealth().then(setIsHealthy);
  }, []);

  const sendMessage = useCallback(
    async (query: string, options?: {
      category?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }) => {
      if (!query.trim()) {
        const err = new Error('Message cannot be empty');
        setError(err);
        onError?.(err);
        return;
      }

      if (!conversationId) {
        const err = new Error('No conversation ID available');
        setError(err);
        onError?.(err);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Add user message immediately for better UX
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      try {
        const response = await oracleClient.sendMessage(
          query,
          userId,
          conversationId,
          {
            ...options,
            isFirstMessage
          }
        );

        // Mark that we've sent at least one message
        if (isFirstMessage) {
          setIsFirstMessage(false);
        }

        // Add Oracle's response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          metadata: {
            tokens: response.usage.total_tokens,
            model: response.model
          }
        };
        setMessages(prev => [...prev, assistantMessage]);

        onSuccess?.(response);
        return response;
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        
        // Remove the user message on error
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, userId, onError, onSuccess, isFirstMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const startNewConversation = useCallback(async () => {
    const newId = await oracleClient.createConversation(userId);
    setConversationId(newId);
    clearMessages();
    setIsFirstMessage(true);
    return newId;
  }, [userId, clearMessages]);

  const generateSummary = useCallback(async (): Promise<SummaryResponse | null> => {
    // Only generate if we have user messages
    const hasUserMessages = messages.some(m => m.role === 'user');
    
    if (!conversationId || !hasUserMessages) {
      return null;
    }

    try {
      const summaryResponse = await oracleClient.generateSummary(conversationId, userId);
      return summaryResponse;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      onError?.(error as Error);
      return null;
    }
  }, [conversationId, userId, messages, onError]);

  // Only handle browser/tab close when there are actual user messages
  useEffect(() => {
    const handleUnload = (e: BeforeUnloadEvent) => {
      const hasUserMessages = messages.some(m => m.role === 'user');
      
      if (hasUserMessages && conversationId) {
        // Use sendBeacon for reliability
        const payload = JSON.stringify({
          conversation_id: conversationId,
          user_id: userId
        });
        
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app'}/api/generate_summary`,
          payload
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [messages, conversationId, userId]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    conversationId,
    isHealthy,
    clearMessages,
    startNewConversation,
    generateSummary
  };
}