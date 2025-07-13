'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOracle } from '@/hooks/useOracle';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface OracleEmbeddedProps {
  quickScanContext?: {
    scanId: string | null;
    bodyPart: string;
    analysis: any;
    confidence: number;
    symptoms?: string;
  };
  onClose?: () => void;
}

export default function OracleEmbedded({ quickScanContext, onClose }: OracleEmbeddedProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
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
    startNewConversation,
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

  // Send initial context message when component mounts
  useEffect(() => {
    if (quickScanContext && !hasGreeted && isHealthy) {
      setHasGreeted(true);
      const contextMessage = quickScanContext.confidence < 70
        ? `I just completed a Quick Scan for ${quickScanContext.bodyPart} symptoms. The AI had low confidence (${quickScanContext.confidence}%) and diagnosed "${quickScanContext.analysis.primaryCondition}". Can you help me understand this better?`
        : `I was diagnosed with "${quickScanContext.analysis.primaryCondition}" from a Quick Scan for ${quickScanContext.bodyPart} symptoms. The confidence was ${quickScanContext.confidence}%. Can you explain more about this condition?`;
      
      sendMessage(contextMessage);
    }
  }, [quickScanContext, hasGreeted, isHealthy, sendMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    const message = input.trim();
    setInput('');
    
    // Include Quick Scan context in metadata if this is a follow-up
    const fullMessage = quickScanContext 
      ? `${message}\n\n[Context: Recent Quick Scan for ${quickScanContext.bodyPart} - ${quickScanContext.analysis.primaryCondition} (${quickScanContext.confidence}% confidence)]`
      : message;
    
    await sendMessage(fullMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isHealthy) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Oracle service is currently unavailable</p>
          <button
            onClick={startNewConversation}
            className="text-blue-400 hover:text-blue-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !isThinking && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Oracle AI Ready</h3>
            <p className="text-gray-400 text-sm">
              Ask follow-up questions about your Quick Scan results
            </p>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">Oracle AI</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">
                {typeof message.content === 'string' 
                  ? message.content 
                  : JSON.stringify(message.content, null, 2)}
              </p>
              {message.metadata?.tokens && (
                <p className="text-xs opacity-50 mt-2">
                  Tokens: {message.metadata.tokens}
                </p>
              )}
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-gray-300">Oracle is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-300 text-sm">
            {error.message || 'An error occurred'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your diagnosis, symptoms, or treatment options..."
            className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {quickScanContext && quickScanContext.scanId && (
          <div className="mt-2 text-xs text-gray-500">
            Connected to Quick Scan #{quickScanContext.scanId.slice(0, 8)}
          </div>
        )}
      </div>
    </div>
  );
}