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
    reasoning_tokens?: number;
    has_reasoning?: boolean;
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
  tier?: string;
  reasoningMode?: boolean;
  onTokenLimitReached?: (limits: TokenLimits) => void;
  onError?: (error: Error) => void;
  onSuccess?: (response: any) => void;
}

export function useOracleEnhanced({
  userId,
  tier = 'free',
  reasoningMode = false,
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
  const [modelUsed, setModelUsed] = useState<string | undefined>();
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
          { 
            isFirstMessage, 
            model: getModelForTier(tier, reasoningMode),
            reasoningMode 
          },
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
            model: getModelForTier(tier, reasoningMode),
            reasoningMode
          }
        );
      }

      if (isFirstMessage) {
        setIsFirstMessage(false);
      }
      
      // Check context status from backend
      if (response?.context_status) {
        console.log('[Oracle] Context status:', response.context_status);
        
        // Handle blocked status (free tier limit reached)
        if (response.context_status.can_continue === false || response.context_status.status === 'blocked') {
          // Update token usage state
          setTokenUsage({
            current: response.context_status.tokens,
            limit: response.context_status.limit
          });
          onTokenLimitReached?.({
            can_continue: false,
            total_tokens: response.context_status.tokens,
            is_premium: tier !== 'free',
            limit: response.context_status.limit,
            percentage: response.context_status.percentage,
            needs_compression: false,
            is_blocked: true
          });
        }
        
        // Handle needs_compression status
        if (response.context_status.needs_compression) {
          setCompressionActive(true);
        }
      }

      // If we streamed, the assistant message is already present and updated.
      if (!streamingEnabled || !response) {
        // Use correct field names from backend
        const finalContent = response?.response || response?.message || response?.raw_response || '';
        
        // Only proceed if we have content
        if (!finalContent) {
          console.error('[Oracle] No content in response:', response);
        }
        
        // FULL DEBUG LOGGING
        console.log('[Oracle] FULL RAW RESPONSE:', response);
        console.log('[Oracle] Response details:', {
          has_reasoning: response?.has_reasoning,
          reasoning_exists: !!response?.reasoning,
          reasoning_length: response?.reasoning?.length || 0,
          model: response?.model,
          reasoning_mode: response?.reasoning_mode,
          reasoning_tokens: response?.usage?.reasoning_tokens,
          response_keys: response ? Object.keys(response) : [],
          usage: response?.usage
        });
        
        if (response?.reasoning) {
          console.log('[Oracle] Reasoning content (first 200 chars):', response.reasoning.substring(0, 200));
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: finalContent,
          timestamp: new Date(),
          metadata: {
            tokens: response?.usage?.total_tokens,
            model: response?.model,
            reasoning: response?.has_reasoning ? response.reasoning : undefined,
            reasoning_tokens: response?.usage?.reasoning_tokens,
            has_reasoning: response?.has_reasoning || false
          }
        };
        
        console.log('[Oracle] Assistant message metadata:', assistantMessage.metadata);
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Update token usage and model used
      const newTotal = tokenUsage.current + response.usage.total_tokens;
      setTokenUsage(prev => ({ ...prev, current: newTotal }));
      setModelUsed(response.model_used || response.model);

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
  }, [conversationId, userId, isFirstMessage, tokenUsage, tier, reasoningMode, checkLimits, onError, onSuccess, onTokenLimitReached]);

  // Load existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    setConversationId(convId);
    setMessages([]); // Clear messages first
    setIsFirstMessage(false);

    try {
      // Load conversation title
      const { data: convData } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', convId)
        .single();
      
      if (convData?.title) {
        setConversationTitle(convData.title);
      }

      // Load messages from Supabase
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at');

      if (messagesData) {
        // Deduplicate messages at the source level
        const messageMap = new Map<string, any>();
        messagesData.forEach(msg => {
          // Use the message ID as key to avoid duplicates
          messageMap.set(msg.id, msg);
        });
        
        const formattedMessages: Message[] = Array.from(messageMap.values()).map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: {
            tokens: msg.token_count,
            model: msg.model_used,
            reasoning: msg.metadata?.reasoning,
            reasoning_tokens: msg.metadata?.reasoning_tokens,
            has_reasoning: msg.metadata?.has_reasoning || false
          }
        }));
        
        // Sort by timestamp to maintain order
        formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
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
    compressionActive,
    modelUsed
  };
}

// Helper function to determine model based on tier and reasoning mode
function getModelForTier(tier: string, reasoningMode: boolean): string {
  if (tier === 'free') {
    // Free tier models
    return reasoningMode ? 'deepseek/deepseek-r1' : 'deepseek/deepseek-chat';
  }
  
  // Premium tiers (basic, pro, pro_plus)
  if (tier === 'basic' || tier === 'pro' || tier === 'pro_plus') {
    if (reasoningMode) {
      // Premium reasoning: Claude 3.7 Sonnet (confirmed working)
      return 'anthropic/claude-3.7-sonnet';
    } else {
      // Premium default: Fast and efficient GPT-5 mini or Claude Sonnet 4
      return 'openai/gpt-5-mini';
    }
  }
  
  // Default/fallback
  return reasoningMode ? 'anthropic/claude-3.7-sonnet' : 'openai/gpt-5-mini';
}