'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  onSendMessage: (content: string) => Promise<void>;
  isBlocked?: boolean;
  conversationId?: string | null;
  showThoughtProcess?: boolean;
}

export function ChatInterface({
  messages,
  isLoading,
  error,
  onSendMessage,
  isBlocked,
  conversationId,
  showThoughtProcess = false
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [localShowReasoning, setLocalShowReasoning] = useState<{ [key: string]: boolean }>({});
  const [streamingText, setStreamingText] = useState<{ [key: string]: string }>({});
  const [isStreaming, setIsStreaming] = useState<{ [key: string]: boolean }>({});

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Simulate text streaming for new messages
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant' && !streamingText[message.id] && !isStreaming[message.id]) {
        // Start streaming animation for new assistant messages
        setIsStreaming(prev => ({ ...prev, [message.id]: true }));
        let currentIndex = 0;
        const text = message.content;
        const streamInterval = setInterval(() => {
          if (currentIndex <= text.length) {
            setStreamingText(prev => ({
              ...prev,
              [message.id]: text.slice(0, currentIndex)
            }));
            currentIndex += 2; // Stream 2 characters at a time for speed
          } else {
            setIsStreaming(prev => ({ ...prev, [message.id]: false }));
            clearInterval(streamInterval);
          }
        }, 10); // Very fast streaming like Claude
        
        return () => clearInterval(streamInterval);
      }
    });
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    // Always scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages, streamingText]);
  
  // Scroll when loading state changes (thinking indicator appears)
  useEffect(() => {
    if (isLoading) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isBlocked) return;

    const query = input.trim();
    setInput('');
    
    // Focus back on input
    textareaRef.current?.focus();
    
    await onSendMessage(query);
    
    // Scroll to bottom after message is sent
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Scroll again when response starts
    setTimeout(() => {
      scrollToBottom();
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Claude-style thinking animation with single pulsing dot
  const renderTypingAnimation = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="py-4 border-b border-white/[0.06]"
    >
      <div className="max-w-[900px] mx-auto px-8">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-base font-medium text-gray-200 mb-2">Oracle</div>
            <motion.div
              className="inline-block w-2.5 h-2.5 bg-gray-400 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 40; // px
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setIsAtBottom(atBottom);
      if (atBottom) setHasUnread(false);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (messages.length === 0 && !conversationId) {
    return (
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-8 shadow-2xl"
                animate={{ 
                  boxShadow: [
                    "0 25px 50px -12px rgba(147, 51, 234, 0.25)",
                    "0 25px 50px -12px rgba(236, 72, 153, 0.25)",
                    "0 25px 50px -12px rgba(147, 51, 234, 0.25)"
                  ] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </motion.div>
              <h1 className="text-3xl font-normal text-gray-100 mb-3">
                <span className="text-purple-400">✦</span> Hi, how are you?
              </h1>
              <p className="text-gray-400 text-base max-w-xl mx-auto">I'm your health AI assistant. Ask me about symptoms, wellness, or medical insights.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3 mt-12 max-w-2xl mx-auto"
            >
              {[
                "Analyze my symptoms",
                "Review medication interactions",
                "Track health patterns",
                "Interpret lab results"
              ].map((prompt, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="text-left p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
                >
                  <p className="text-gray-300 text-sm">{prompt}</p>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
        
        {/* Input Area for empty state */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10">
          <div className="max-w-[850px] mx-auto px-8">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isBlocked ? "Upgrade to continue chatting..." : "Message Oracle..."}
                disabled={isBlocked}
                className={`w-full px-4 py-3 pr-12 bg-[#161616] border border-white/[0.08] rounded-xl text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:bg-[#1a1a1a] transition-all text-[15px] ${
                  isBlocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ minHeight: '48px' }}
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || isBlocked}
                className={`absolute bottom-2.5 right-2.5 p-2 rounded-lg transition-all ${
                  input.trim() && !isLoading && !isBlocked
                    ? 'text-purple-400 hover:bg-purple-500/10'
                    : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto oracle-scrollbar" style={{ paddingBottom: '120px' }}>
        <div className="py-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                {message.role === 'user' ? (
                  // User Message - Claude Style
                  <div className="py-4">
                    <div className="max-w-[900px] mx-auto px-8">
                      <div className="flex justify-end">
                        <div className="flex gap-3 items-start max-w-[70%]">
                          <div className="text-[17px] text-gray-100 leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">CK</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Assistant Message - Claude Style
                  <div className="py-4 border-b border-white/[0.06] last:border-0">
                    {/* Thought Process Section (Claude-style collapsed) */}
                    {message.metadata?.reasoning && (
                      <div className="max-w-[900px] mx-auto px-8 mb-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-[#0f0f0f] border border-white/[0.08] rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              const newState = { ...localShowReasoning };
                              newState[message.id] = !newState[message.id];
                              setLocalShowReasoning(newState);
                            }}
                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-400">Thought process</span>
                              <span className="text-xs text-gray-500">{localShowReasoning[message.id] ? '2s' : `${Math.round(message.metadata.reasoning.length / 50)}s`}</span>
                            </div>
                            <svg 
                              className={`w-4 h-4 text-gray-500 transition-transform ${
                                localShowReasoning[message.id] ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <AnimatePresence>
                            {localShowReasoning[message.id] && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-white/[0.08]"
                              >
                                <div className="px-4 py-3">
                                  <div className="text-[15px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                                    {message.metadata.reasoning}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}
                    
                    {/* Main Message Content */}
                    <div className="max-w-[900px] mx-auto px-8">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-medium text-gray-200 mb-2">Oracle</div>
                          <div className="text-[17px] text-gray-100 leading-[1.7] whitespace-pre-wrap">
                            {streamingText[message.id] || message.content}
                            {isStreaming[message.id] && (
                              <motion.span
                                className="inline-block w-[2px] h-[1.1em] bg-gray-400 ml-[2px] align-text-bottom"
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && renderTypingAnimation()}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4"
            >
              <div className="max-w-[900px] mx-auto px-8">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                  <p className="font-medium text-sm">Connection Error</p>
                  <p className="text-xs opacity-80 mt-1">{error.message}</p>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 right-8 z-10 px-3 py-2 bg-white/[0.06] border border-white/[0.12] rounded-full text-xs text-gray-200 hover:bg-white/[0.1] transition-colors"
        >
          {hasUnread ? 'New messages' : 'Jump to bottom'}
        </button>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.08] bg-[#0a0a0a]">
        <div className="max-w-[900px] mx-auto px-8 py-5">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isBlocked ? "Upgrade to continue..." : "Message Oracle..."}
              disabled={isBlocked}
              className={`w-full px-5 py-4 pr-14 bg-[#161616] border border-white/[0.08] rounded-xl text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:bg-[#1a1a1a] transition-all text-[17px] ${
                isBlocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ minHeight: '56px' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isBlocked}
              className={`absolute bottom-3 right-3 p-2.5 rounded-lg transition-all ${
                input.trim() && !isLoading && !isBlocked
                  ? 'text-purple-400 hover:bg-purple-500/10'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Medical disclaimer */}
          <p className="text-[11px] text-gray-500 mt-2 text-center">
            Oracle provides educational health information and is not a substitute for professional medical advice.
          </p>

          {isBlocked && (
            <p className="text-xs text-amber-500 mt-1 text-center">
              You've reached the free tier limit. Upgrade to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}