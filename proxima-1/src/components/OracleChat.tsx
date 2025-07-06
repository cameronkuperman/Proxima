'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface OracleChatProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore?: number;
}

export default function OracleChat({ isOpen, onClose, healthScore = 92 }: OracleChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'ve been reviewing your health data. How are you feeling today? I noticed your sleep quality has improved this week.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand you\'re experiencing headaches in the mornings. Based on your sleep data and the pattern you\'ve described, this could be related to several factors. Let me analyze your recent health metrics to provide more specific insights.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop - more subtle like Claude */}
          <motion.div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Chat Container - Claude-inspired with Proxima touches */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl h-[85vh] max-h-[800px] bg-[#0a0a0a]/98 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/[0.08] flex flex-col"
          >
            {/* Header - Minimal like Claude */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  {isThinking && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">Health Oracle</h3>
                  <p className="text-xs text-gray-400">Always here to help</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Area - Clean like Claude */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="px-6 py-6 space-y-5">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {message.role === 'assistant' ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0 shadow-lg shadow-purple-500/20"
                      />
                    ) : (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex-shrink-0"
                      />
                    )}
                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <motion.div 
                        initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`inline-block px-5 py-3 rounded-2xl max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-white/[0.08] text-gray-200 border border-white/[0.05]'
                            : 'bg-white/[0.02] text-gray-200 border border-white/[0.03]'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
                
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0 shadow-lg shadow-purple-500/20" />
                    <div className="bg-white/[0.02] border border-white/[0.03] rounded-2xl px-5 py-3">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                            animate={{
                              y: [0, -6, 0],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              ease: "easeInOut",
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Claude-style with health context */}
            <div className="border-t border-white/[0.08] px-6 py-4 bg-[#0a0a0a]/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your health..."
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all text-[15px] leading-relaxed min-h-[48px] max-h-[120px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    style={{ height: '48px' }}
                  />
                  
                  {/* Subtle health context indicator */}
                  {input.toLowerCase().includes('headache') || input.toLowerCase().includes('pain') ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-2 left-3 px-2 py-0.5 bg-[#0a0a0a] rounded-full"
                    >
                      <span className="text-xs text-purple-400">Symptom detected</span>
                    </motion.div>
                  ) : null}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className={`p-3 rounded-xl transition-all ${
                    input.trim() && !isThinking
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/[0.03] text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
              </div>
              
              {/* Minimal context bar */}
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Health Score: {healthScore}/100
                  </span>
                  <span>•</span>
                  <span>Secure & Private</span>
                </div>
                <button className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                  Export chat
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}