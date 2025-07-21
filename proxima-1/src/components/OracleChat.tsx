'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOracle } from '@/hooks/useOracle';
import { useAuth } from '@/contexts/AuthContext';
import { SummaryNotification } from './SummaryNotification';

interface OracleChatProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore?: number;
}

export default function OracleChat({ isOpen, onClose, healthScore = 92 }: OracleChatProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summarySuccess, setSummarySuccess] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Initialize Oracle with user ID
  const {
    messages,
    sendMessage,
    isLoading: isThinking,
    error,
    conversationId,
    isHealthy,
    startNewConversation,
    generateSummary
  } = useOracle({
    userId: user?.id || 'anonymous',
    onError: (error) => {
      console.error('Oracle error:', error);
    },
    onSummaryGenerated: (summary) => {
      // Show notification when auto-summary is generated
      setIsGeneratingSummary(true);
      setSummarySuccess(true);
      setSummaryError(null);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setIsGeneratingSummary(false);
        setSummarySuccess(false);
      }, 3000);
    }
  });

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
    if (!input.trim() || isThinking) return;

    const query = input.trim();
    setInput('');
    
    try {
      await sendMessage(query);
    } catch (error) {
      // Error is already handled by the hook
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper function to render message content
  const renderMessageContent = (content: string | Record<string, any>) => {
    // Handle structured JSON responses
    if (typeof content === 'object' && content !== null) {
      // Check if it's a health analysis response
      if ('confidence_level' in content || 'symptoms' in content || 'recommendations' in content) {
        return (
          <div className="space-y-2">
            {content.confidence_level && (
              <div className="text-sm">
                <span className="opacity-70">Confidence: </span>
                <span className="font-medium">{(content.confidence_level * 100).toFixed(0)}%</span>
              </div>
            )}
            {content.symptoms_identified && (
              <div className="text-sm">
                <span className="opacity-70">Symptoms detected: </span>
                <span className="font-medium">{content.symptoms_identified.join(', ')}</span>
              </div>
            )}
            {content.recommendations && (
              <div className="text-sm space-y-1">
                <span className="opacity-70">Recommendations:</span>
                <ul className="list-disc list-inside ml-2">
                  {content.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Fallback to formatted JSON for other properties */}
            <pre className="text-xs bg-white/5 p-2 rounded overflow-x-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
      }
      
      // Generic JSON response
      return (
        <pre className="text-sm bg-white/5 p-2 rounded overflow-x-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
    }

    // Regular text response - preserve line breaks
    return (
      <div className="whitespace-pre-wrap break-words">
        {content}
      </div>
    );
  };

  return (
    <>
      <SummaryNotification 
        isGenerating={isGeneratingSummary}
        success={summarySuccess}
        error={summaryError || undefined}
      />
      
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
                  <p className="text-xs text-gray-400">
                    {isHealthy === true ? 'Connected' : 
                     isHealthy === false ? 'Disconnected' : 
                     'Connecting...'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={async () => {
                  // Only generate summary if there are actual messages from users
                  const hasUserMessages = messages.some(m => m.role === 'user');
                  
                  if (hasUserMessages) {
                    setIsGeneratingSummary(true);
                    setSummaryError(null);
                    setSummarySuccess(false);
                    
                    try {
                      const summary = await generateSummary();
                      setIsGeneratingSummary(false);
                      
                      if (summary?.status === 'success') {
                        setSummarySuccess(true);
                        // Small delay to show success
                        setTimeout(() => {
                          onClose();
                        }, 500);
                      } else {
                        onClose();
                      }
                    } catch (error) {
                      setIsGeneratingSummary(false);
                      onClose();
                    }
                  } else {
                    // No messages, just close
                    onClose();
                  }
                }}
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
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-400 mt-8"
                  >
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-lg mb-2">Welcome to Oracle Health Assistant</p>
                    <p className="text-sm opacity-70">I'm here to help analyze your health concerns and provide insights.</p>
                    <p className="text-sm opacity-70 mt-1">How are you feeling today?</p>
                  </motion.div>
                )}
                
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
                        <div className="text-[15px] leading-relaxed">
                          {renderMessageContent(message.content)}
                        </div>
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
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg"
                  >
                    <p className="font-medium text-sm">Connection Error</p>
                    <p className="text-xs opacity-80 mt-1">{error.message}</p>
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
                <div className="flex items-center gap-3">
                  <button 
                    onClick={startNewConversation}
                    className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
                  >
                    New chat
                  </button>
                  <button 
                    onClick={() => {
                      const chatData = {
                        conversationId,
                        messages: messages.map(m => ({
                          role: m.role,
                          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                          timestamp: m.timestamp
                        }))
                      };
                      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `oracle-chat-${conversationId.slice(0, 8)}.json`;
                      a.click();
                    }}
                    className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
                  >
                    Export chat
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}