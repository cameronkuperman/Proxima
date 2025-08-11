'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatInterface } from './ChatInterface';
import { UpgradeModal } from './UpgradeModal';
import { useOracleEnhanced } from '@/hooks/useOracleEnhanced';
import { supabase } from '@/lib/supabase';

export default function OracleEnhanced() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  // Sidebar state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [compressionPrompt, setCompressionPrompt] = useState(false);
  type TokenLimitsState = {
    total_tokens?: number;
    limit?: number;
    percentage?: number;
    is_premium?: boolean;
    is_blocked?: boolean;
    needs_compression?: boolean;
  };
  const [tokenLimits, setTokenLimits] = useState<TokenLimitsState | null>(null);
  
  const {
    messages,
    sendMessage,
    isLoading,
    error: chatError,
    conversationId,
    conversationTitle,
    updateTitle,
    startNewConversation,
    loadConversation,
    compressionActive
  } = useOracleEnhanced({
    userId: user?.id || 'anonymous',
    onTokenLimitReached: (limits) => {
      setTokenLimits(limits as unknown as TokenLimitsState);
      if (limits.is_blocked) {
        setShowUpgradeModal(true);
      } else if (limits.needs_compression && !compressionActive) {
        setCompressionPrompt(true);
      }
    }
  });

  // Check token limits on mount and message send
  const checkLimits = useCallback(async () => {
    if (!conversationId || !user?.id) return;
    
    const { data } = await supabase
      .rpc('check_conversation_limits', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });
    
    if (data) {
      setTokenLimits(data);
    }
  }, [conversationId, user?.id]);

  // Load conversation from URL params (for timeline integration)
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    if (conversationParam && user?.id) {
      loadConversation(conversationParam);
    }
  }, [searchParams, user?.id, loadConversation]);

  useEffect(() => {
    checkLimits();
  }, [conversationId, messages.length, checkLimits]);

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (conversationId && messages.length > 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oracle/exit-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            user_id: user?.id
          })
        });
      }
    };
  }, [conversationId, messages.length, user?.id]);

  const handleConversationSelect = async (convId: string) => {
    await loadConversation(convId);
    setSidebarOpen(false);
  };

  const handleNewConversation = () => {
    startNewConversation();
    setSidebarOpen(false);
  };

  const handleCompression = () => {
    setCompressionPrompt(false);
    // Compression happens automatically on next message
  };

  // Ensure `ChatInterface` receives the expected handler signature
  const handleSendChat = async (content: string): Promise<void> => {
    await sendMessage(content);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex">
      {/* Left Sidebar Rail - Claude Style */}
      <div className="fixed left-0 top-0 bottom-0 w-[52px] border-r border-white/[0.08] bg-[#0f0f0f] flex flex-col items-center py-3 gap-1 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <button onClick={handleNewConversation} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors" aria-label="New chat">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
      
      {/* Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userId={user?.id || ''}
        currentConversationId={conversationId}
        onSelectConversation={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />

      {/* Main Chat Area */}
      <div className="ml-[52px] flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Bar - Claude Style */}
        <div className="h-[56px] border-b border-white/[0.08] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => {
                  if (titleInput.trim()) {
                    updateTitle(titleInput.trim());
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (titleInput.trim()) {
                      updateTitle(titleInput.trim());
                    }
                    setIsEditingTitle(false);
                  }
                  if (e.key === 'Escape') {
                    setTitleInput(conversationTitle);
                    setIsEditingTitle(false);
                  }
                }}
                className="px-2 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-base text-gray-200 focus:outline-none focus:border-purple-500/50"
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  if (conversationTitle) {
                    setTitleInput(conversationTitle);
                    setIsEditingTitle(true);
                  }
                }}
                className="text-base font-medium text-gray-200 hover:text-white transition-colors"
              >
                {conversationTitle || (conversationId ? 'Health Consultation' : 'New conversation')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] rounded-lg transition-colors">
              <span>DeepSeek R1</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Share */}
            <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464 0m5.464 0a3 3 0 01-5.464 0M6.732 6.732a3 3 0 10-4.464 4.464m4.464-4.464a3 3 0 00-4.464 4.464m13.464 0a3 3 0 104.464-4.464m-4.464 4.464a3 3 0 004.464-4.464" />
              </svg>
            </button>
          </div>
        </div>

        {/* Token Usage Bar */}
        {tokenLimits && (
          <div className="h-0.5 bg-[#0a0a0a]">
            <div 
              className={`h-full transition-all duration-500 ${
                (tokenLimits?.percentage ?? 0) > 80 ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
                (tokenLimits?.percentage ?? 0) > 50 ? 'bg-gradient-to-r from-blue-600 to-purple-600' :
                'bg-gradient-to-r from-green-600 to-emerald-600'
              }`}
              style={{ width: `${Math.min(tokenLimits?.percentage ?? 0, 100)}%` }}
            />
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            error={chatError}
            onSendMessage={handleSendChat}
            isBlocked={!!tokenLimits?.is_blocked}
            conversationId={conversationId}
          />
        </div>
      </div>

      {/* Compression Prompt */}
      <AnimatePresence>
        {compressionPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-[#1a1a1a] border border-amber-500/20 rounded-xl p-4 max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Approaching Context Limit</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    You’re approaching the context limit. Would you like to enable intelligent compression to continue this conversation seamlessly?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCompression}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-500 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
                    >
                      Enable Compression
                    </button>
                    <button
                      onClick={() => setCompressionPrompt(false)}
                      className="px-3 py-1.5 bg-white/[0.05] text-gray-400 rounded-lg text-sm hover:bg-white/[0.08] transition-colors"
                    >
                      Continue Without
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={tokenLimits?.is_premium ? 'premium' : 'free'}
        tokenUsage={tokenLimits}
      />
    </div>
  );
}