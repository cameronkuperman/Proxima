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
  onSummaryGenerated?: (summary: SummaryResponse) => void;
}

export function useOracle({
  userId,
  conversationId: initialConversationId,
  onError,
  onSuccess,
  onSummaryGenerated
}: UseOracleOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId || ''
  );
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [lastSummaryAt, setLastSummaryAt] = useState<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const summaryGeneratedRef = useRef<boolean>(false);

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

        // Check if we should generate a summary
        const totalMessages = messages.length + 2; // +2 for the new messages
        const messagesSinceLastSummary = totalMessages - lastSummaryAt;
        
        // Generate summary after every 5 message exchanges (10 total messages)
        if (messagesSinceLastSummary >= 10 && !summaryGeneratedRef.current) {
          summaryGeneratedRef.current = true;
          generateSummary().then((summary) => {
            setLastSummaryAt(totalMessages);
            summaryGeneratedRef.current = false;
            if (summary && onSummaryGenerated) {
              onSummaryGenerated(summary);
            }
          }).catch(err => {
            console.warn('Auto-summary generation failed:', err);
            summaryGeneratedRef.current = false;
          });
        }

        // Reset inactivity timer
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        
        // Set new inactivity timer (2 minutes)
        inactivityTimerRef.current = setTimeout(() => {
          const currentMessages = messages.concat([userMessage, assistantMessage]);
          const hasUserMessages = currentMessages.some(m => m.role === 'user');
          if (hasUserMessages && !summaryGeneratedRef.current) {
            summaryGeneratedRef.current = true;
            generateSummary().then((summary) => {
              summaryGeneratedRef.current = false;
              if (summary && onSummaryGenerated) {
                onSummaryGenerated(summary);
              }
            }).catch(err => {
              console.warn('Inactivity-triggered summary generation failed:', err);
              summaryGeneratedRef.current = false;
            });
          }
        }, 120000); // 2 minutes

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
    // Generate summary for current conversation before starting new one
    if (messages.some(m => m.role === 'user') && !summaryGeneratedRef.current) {
      summaryGeneratedRef.current = true;
      try {
        const summary = await generateSummary();
        if (summary && onSummaryGenerated) {
          onSummaryGenerated(summary);
        }
      } catch (err) {
        console.warn('Summary generation before new conversation failed:', err);
      } finally {
        summaryGeneratedRef.current = false;
      }
    }
    
    const newId = await oracleClient.createConversation(userId);
    setConversationId(newId);
    clearMessages();
    setIsFirstMessage(true);
    setLastSummaryAt(0);
    
    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    
    return newId;
  }, [userId, clearMessages, messages, generateSummary, onSummaryGenerated]);

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

  // Clean up inactivity timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

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