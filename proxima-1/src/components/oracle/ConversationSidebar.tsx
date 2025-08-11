'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  message_count: number;
  total_tokens: number;
  metadata: { medical_flags?: string[]; [key: string]: unknown } | null;
  llm_context?: Array<{ llm_summary: string }>;
}

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userId: string;
  currentConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  isOpen,
  onToggle,
  userId,
  currentConversationId,
  onSelectConversation,
  onNewConversation
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          last_message_at,
          message_count,
          total_tokens,
          metadata,
          llm_context!left(llm_summary)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (data) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  const groupConversations = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, Conversation[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const filtered = conversations.filter(conv => 
      !searchQuery || conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.forEach(conv => {
      const date = new Date(conv.last_message_at);
      if (date >= today) {
        groups.today.push(conv);
      } else if (date >= yesterday) {
        groups.yesterday.push(conv);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groups = groupConversations();

  // Future actions: pin/color/rename — keeping UI minimal for now

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : -260,
          width: isOpen ? 260 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-50 h-full bg-gradient-to-b from-[#111111] to-[#0a0a0a] border-r border-white/[0.06] flex flex-col overflow-hidden shadow-xl"
      >
        <div className="flex-1 flex flex-col min-w-[260px]">
          {/* Collapsed icon rail */}
          {!isOpen && (
            <div className="absolute top-2 left-full ml-2 flex flex-col gap-2">
              <button onClick={onToggle} className="icon-btn p-2 text-gray-400 hover:text-white" aria-label="Open sidebar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16"/></svg>
              </button>
            </div>
          )}
          {/* Header */}
          <div className="p-3 border-b border-white/[0.08]">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] rounded-lg transition-all group"
            >
              <div className="w-7 h-7 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.06]">
                <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">New chat</span>
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-white/[0.08]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/[0.1] transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto oracle-scrollbar">
            {loading ? (
              <div className="p-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="mb-2 p-3 bg-white/[0.02] rounded-lg animate-pulse">
                    <div className="h-4 bg-white/[0.05] rounded mb-2" />
                    <div className="h-3 bg-white/[0.03] rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {groups.today.length > 0 && (
                  <ConversationGroup
                    title="Today"
                    conversations={groups.today}
                    currentId={currentConversationId}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                    onSelect={onSelectConversation}
                  />
                )}
                {groups.yesterday.length > 0 && (
                  <ConversationGroup
                    title="Yesterday"
                    conversations={groups.yesterday}
                    currentId={currentConversationId}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                    onSelect={onSelectConversation}
                  />
                )}
                {groups.thisWeek.length > 0 && (
                  <ConversationGroup
                    title="This Week"
                    conversations={groups.thisWeek}
                    currentId={currentConversationId}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                    onSelect={onSelectConversation}
                  />
                )}
                {groups.older.length > 0 && (
                  <ConversationGroup
                    title="Older"
                    conversations={groups.older}
                    currentId={currentConversationId}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                    onSelect={onSelectConversation}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer - Account Section */}
          <div className="border-t border-white/[0.08]">
            {/* Tutor/Help placeholder */}
            <div className="p-2 border-b border-white/[0.08]">
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.05] rounded-lg transition-colors text-left">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                <span className="text-sm text-gray-400">Tutorials & Help</span>
                <span className="ml-auto text-xs text-gray-500">Soon</span>
              </button>
            </div>
            {/* Quick Actions */}
            <div className="p-2 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.05] rounded-lg transition-colors text-left">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm text-gray-400">Health Score</span>
                <span className="ml-auto text-xs text-green-400">92</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.05] rounded-lg transition-colors text-left">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-400">Reports</span>
                <span className="ml-auto text-xs text-gray-500">12</span>
              </button>
            </div>
            
            {/* Account */}
            <div className="p-2 border-t border-white/[0.08]">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] rounded-lg transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.12] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">U</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">User</p>
                  <p className="text-xs text-gray-500">Free plan</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function ConversationGroup({
  title,
  conversations,
  currentId,
  hoveredId,
  onHover,
  onSelect
}: {
  title: string;
  conversations: Conversation[];
  currentId?: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-normal text-gray-600 px-3 mb-1.5">{title}</h3>
      {conversations.map(conv => (
        <motion.button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          onMouseEnter={() => onHover(conv.id)}
          onMouseLeave={() => onHover(null)}
          className={`w-full text-left px-3 py-2 rounded-lg mb-0.5 transition-colors relative group ${
            currentId === conv.id
              ? 'bg-white/[0.05] text-white'
              : 'hover:bg-white/[0.03] text-gray-400 hover:text-gray-200'
          }`}
          whileHover={{ x: 2 }}
        >
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{conv.title || 'New conversation'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{conv.message_count} messages</p>
            </div>
          </div>

          {/* Hover tooltip with summary */}
          <AnimatePresence>
            {hoveredId === conv.id && conv.llm_context?.[0]?.llm_summary && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-2 top-0 z-60 w-64 p-3 bg-[#1a1a1a] border border-white/[0.1] rounded-lg shadow-xl"
              >
                <p className="text-xs text-gray-400 mb-1">Summary</p>
                <p className="text-sm text-gray-300 line-clamp-4">
                  {conv.llm_context[0].llm_summary}
                </p>
                {conv.metadata?.medical_flags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {conv.metadata.medical_flags.slice(0, 3).map((flag: string) => (
                      <span key={flag} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                        {flag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  );
}