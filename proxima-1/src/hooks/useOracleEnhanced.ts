import { useState, useCallback, useRef, useEffect } from 'react';
import { oracleClient } from '@/lib/oracle-client';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    reasoning?: string;
  };
}

interface TokenLimits {
  can_continue: boolean;
  total_tokens: number;
  is_premium: boolean;
  limit: number;
  percentage: number;
  needs_compression: boolean;
  is_blocked: boolean;
}

export interface UseOracleEnhancedOptions {
  userId: string;
  onTokenLimitReached?: (limits: TokenLimits) => void;
  onError?: (error: Error) => void;
  onSuccess?: (response: any) => void;
}

export function useOracleEnhanced({
  userId,
  onTokenLimitReached,
  onError,
  onSuccess
}: UseOracleEnhancedOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [tokenUsage, setTokenUsage] = useState({ current: 0, limit: 100000 });
  const [compressionActive, setCompressionActive] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const streamingEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ORACLE_STREAMING === 'true';

  // Check token limits
  const checkLimits = useCallback(async (convId: string) => {
    if (!convId || !userId) return null;

    const { data, error } = await supabase
      .rpc('check_conversation_limits', {
        p_conversation_id: convId,
        p_user_id: userId
      });

    if (data) {
      setTokenUsage({ current: data.total_tokens, limit: data.limit });
      setCompressionActive(data.needs_compression);
      
      if (data.is_blocked || data.needs_compression) {
        onTokenLimitReached?.(data);
      }
    }

    return data;
  }, [userId, onTokenLimitReached]);

  // Generate conversation title
  const generateTitle = useCallback(async (firstUserMessage: string, firstAssistantMessage: string) => {
    try {
      // Simple title generation using first few words
      const words = firstUserMessage.split(' ').slice(0, 5).join(' ');
      const title = words.length > 30 ? words.substring(0, 30) + '...' : words;
      setConversationTitle(title);
      
      // Update conversation title in database
      if (conversationId) {
        await supabase
          .from('conversations')
          .update({ title })
          .eq('id', conversationId);
      }
      
      return title;
    } catch (error) {
      console.error('Error generating title:', error);
      const fallbackTitle = 'Health Consultation';
      setConversationTitle(fallbackTitle);
      return fallbackTitle;
    }
  }, [conversationId]);

  // Update conversation title
  const updateTitle = useCallback(async (newTitle: string) => {
    setConversationTitle(newTitle);
    if (conversationId) {
      await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    // Create conversation if needed
    let convId = conversationId;
    if (!convId) {
      convId = uuidv4();
      setConversationId(convId);
    }

    // Check limits before sending
    const limits = await checkLimits(convId);
    if (limits?.is_blocked) {
      onTokenLimitReached?.(limits);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Prefer streaming if enabled and available
      let response = null as any;
      if (streamingEnabled) {
        let assistantId = `assistant-${Date.now()}`;
        response = await oracleClient.streamMessage(
          query,
          userId,
          convId,
          { isFirstMessage, model: 'tngtech/deepseek-r1t-chimera:free' },
          {
            onStart: () => {
              // Create a placeholder assistant message for streaming deltas
              const placeholder: Message = {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                metadata: { reasoning: '' }
              };
              setMessages(prev => [...prev, placeholder]);
            },
            onReasoningDelta: (delta: string) => {
              setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m,
                metadata: { ...(m.metadata || {}), reasoning: `${(m.metadata?.reasoning || '')}${delta}` }
              } : m));
            },
            onContentDelta: (delta: string) => {
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `${m.content}${delta}` } : m));
            },
            onDone: () => {}
          }
        );
      }

      // If streaming not available or failed, do normal request
      if (!response) {
        response = await oracleClient.sendMessage(
          query,
          userId,
          convId,
          {
            isFirstMessage,
            model: 'tngtech/deepseek-r1t-chimera:free'
          }
        );
      }

      if (isFirstMessage) {
        setIsFirstMessage(false);
      }

      // If we streamed, the assistant message is already present and updated.
      if (!streamingEnabled || !response) {
        // Process the response to extract final content and (optional) reasoning for R1-like models
        let finalContent = '';
        let reasoning = '';
        if (typeof response.response === 'string') {
          const parts = response.response.split('\n\n');
          if (parts.length > 1) {
            reasoning = parts.slice(0, -1).join('\n\n');
            finalContent = parts[parts.length - 1].trim();
          } else {
            finalContent = response.response;
          }
        } else {
          finalContent = JSON.stringify(response.response);
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: finalContent,
          timestamp: new Date(),
          metadata: {
            tokens: response?.usage?.total_tokens,
            model: response?.model,
            reasoning
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Update token usage
      const newTotal = tokenUsage.current + response.usage.total_tokens;
      setTokenUsage(prev => ({ ...prev, current: newTotal }));

      // Check limits after sending
      await checkLimits(convId);

      onSuccess?.(response);
      return response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, userId, isFirstMessage, tokenUsage, checkLimits, onError, onSuccess, onTokenLimitReached]);

  // Load existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    setConversationId(convId);
    setMessages([]);
    setIsFirstMessage(false);

    try {
      // Load messages from Supabase
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at');

      if (messagesData) {
        const formattedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: {
            tokens: msg.token_count,
            model: msg.model_used
          }
        }));
        setMessages(formattedMessages);
      }

      // Check limits for loaded conversation
      await checkLimits(convId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      onError?.(error as Error);
    }
  }, [checkLimits, onError]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    const newId = uuidv4();
    setConversationId(newId);
    setConversationTitle('');
    setMessages([]);
    setIsFirstMessage(true);
    setTokenUsage({ current: 0, limit: 100000 });
    setCompressionActive(false);
    return newId;
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    conversationId,
    conversationTitle,
    updateTitle,
    startNewConversation,
    loadConversation,
    tokenUsage,
    compressionActive
  };
}