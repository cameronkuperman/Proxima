'use client';

import { motion } from 'framer-motion';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { formatDistanceToNow } from 'date-fns';

interface ConversationHistoryProps {
  userId: string;
  onSelectConversation?: (conversationId: string) => void;
  currentConversationId?: string;
}

export function ConversationHistory({ 
  userId, 
  onSelectConversation,
  currentConversationId 
}: ConversationHistoryProps) {
  const { conversations, isLoading, error } = useConversationHistory(userId);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-pulse">Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        <p className="text-sm">Failed to load conversations</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs opacity-70 mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Conversations</h3>
      
      {conversations.map((conversation) => (
        <motion.button
          key={conversation.id}
          onClick={() => onSelectConversation?.(conversation.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full text-left p-3 rounded-lg transition-all ${
            currentConversationId === conversation.id
              ? 'bg-white/10 border border-white/20'
              : 'bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate font-medium">
                {conversation.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {conversation.message_count} messages
                </span>
                <span className="text-xs text-gray-600">•</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            {conversation.ai_provider && (
              <div className={`text-xs px-2 py-1 rounded-full ${getProviderStyle(conversation.ai_provider)}`}>
                {conversation.ai_provider}
              </div>
            )}
          </div>
          
          {conversation.total_tokens > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {conversation.total_tokens.toLocaleString()} tokens used
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function getProviderStyle(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'bg-green-500/20 text-green-400';
    case 'claude':
      return 'bg-purple-500/20 text-purple-400';
    case 'google':
      return 'bg-blue-500/20 text-blue-400';
    case 'openrouterai':
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

// Install date-fns if not already installed:
// npm install date-fns