'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useOracle } from '@/hooks/useOracle';
import { useAuth } from '@/contexts/AuthContext';

export default function OracleFullScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Initialize Oracle with user ID
  const {
    messages,
    sendMessage,
    isLoading: isThinking,
    error,
    conversationId,
    isHealthy,
    startNewConversation
  } = useOracle({
    userId: user?.id || 'anonymous',
    onError: (error) => {
      console.error('Oracle error:', error);
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
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const query = input.trim();
    setInput('');
    setHasStarted(true);
    
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
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col">
      {/* Header - Minimal like Claude */}
      <div className="border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-white font-medium">Health Oracle</span>
              <span className="text-xs text-gray-400 ml-2">
                {isHealthy === true ? '• Connected' : 
                 isHealthy === false ? '• Disconnected' : 
                 '• Connecting...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={startNewConversation}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              New Conversation
            </button>
            <span className="text-xs text-gray-400">Health Score: 92/100</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!hasStarted ? (
          /* Claude-like starting screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl w-full px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold text-white mb-3">Hello! I'm your Health Oracle</h1>
                <p className="text-gray-400 text-lg">I can help you understand your symptoms, analyze health patterns, and provide insights based on your data.</p>
              </motion.div>

              {/* Suggested prompts */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8"
              >
                {[
                  "Analyze my recent headache patterns",
                  "What's causing my morning fatigue?",
                  "Review my sleep quality this week",
                  "Help me understand my symptoms"
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
                  >
                    <p className="text-gray-300 text-sm">{prompt}</p>
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        ) : (
          /* ChatGPT-style conversation view */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-8">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mb-8 ${message.role === 'user' ? '' : ''}`}
                  >
                    <div className="flex gap-4">
                      {message.role === 'assistant' ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {message.role === 'assistant' ? 'Oracle' : 'You'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-gray-300 leading-relaxed">
                          {renderMessageContent(message.content)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">Oracle</span>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{
                              opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                              duration: 1.4,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                    <p className="font-medium text-sm">Connection Error</p>
                    <p className="text-xs opacity-80 mt-1">{error.message}</p>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area - Always visible at bottom */}
        <div className="border-t border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your health..."
                className="w-full px-4 py-3 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-white/[0.15] transition-all text-[15px] leading-relaxed"
                style={{ minHeight: '52px' }}
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${
                  input.trim() && !isThinking
                    ? 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
                    : 'bg-transparent text-gray-600 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}