'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OracleAIModalProps {
  isOpen: boolean
  onClose: () => void
  analysisData: any
  bodyPart: string
}

export default function OracleAIModal({ isOpen, onClose, analysisData, bodyPart }: OracleAIModalProps) {
  const [oracleQuestion, setOracleQuestion] = useState('')
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const confidence = analysisData?.confidence || 65
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSendMessage = async (predefinedQuestion?: string) => {
    const question = predefinedQuestion || oracleQuestion.trim()
    if (!question || isStreaming) return
    
    // Add user message
    const userMessage = { role: 'user' as const, content: question }
    setMessages(prev => [...prev, userMessage])
    setOracleQuestion('')
    setIsStreaming(true)
    
    try {
      // Prepare context with analysis data
      const context = {
        diagnosis: analysisData.primaryCondition || analysisData.diagnosis,
        confidence: analysisData.confidence,
        bodyPart: bodyPart,
        differentials: analysisData.differentials || analysisData.other_possibilities,
        reasoning: analysisData.reasoning || 'Based on the symptoms and examination'
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,  // Backend now supports this
          query: question,    // Backwards compatibility
          context: `Patient has been diagnosed with ${context.diagnosis} (${context.confidence}% confidence) affecting the ${context.bodyPart}. ${context.differentials?.length ? `Other possibilities include: ${context.differentials.map((d: any) => `${d.condition || d.name} (${d.probability || d.likelihood}%)`).join(', ')}.` : ''}`,
          conversation_id: `oracle-modal-${Date.now()}`,
          model: 'openai/gpt-4o-mini',
          user_id: null  // Backend supports anonymous users
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Oracle AI error:', response.status, errorText)
        throw new Error(`Failed to get response: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Add assistant message
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.response || data.message || 'I can help you understand your diagnosis better. What would you like to know?'
      }
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error('Oracle chat error:', error)
      let errorContent = 'I apologize, but I encountered an error. Please try asking your question again.'
      
      // Since backend is fixed, these errors should be rare
      if (error instanceof Error) {
        console.error('Oracle AI error details:', error)
      }
      
      const errorMessage = {
        role: 'assistant' as const,
        content: errorContent
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsStreaming(false)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 20 }}
            className="fixed inset-x-4 bottom-4 top-[20%] md:inset-x-auto md:right-[5%] md:left-auto md:w-[450px] md:bottom-[5%] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Oracle AI Assistant</h3>
                      <p className="text-xs text-gray-400">Ask anything about your {bodyPart} analysis</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Container */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-500">
                      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                        <p className="text-sm font-medium text-gray-300">Your diagnosis: {analysisData?.primaryCondition || 'Health Analysis'}</p>
                        <p className="text-xs text-gray-400 mt-1">{confidence}% confidence</p>
                      </div>
                      <p className="text-sm mb-4">Ask me anything about your diagnosis, symptoms, or treatment options.</p>
                      <div className="space-y-2 w-full max-w-sm">
                        <button
                          onClick={() => handleSendMessage("What lifestyle changes can help with my condition?")}
                          className="block w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          💡 What lifestyle changes can help?
                        </button>
                        <button
                          onClick={() => handleSendMessage("Should I see a specialist for this?")}
                          className="block w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          👨‍⚕️ Should I see a specialist?
                        </button>
                        <button
                          onClick={() => handleSendMessage("What are the long-term effects if untreated?")}
                          className="block w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          ⏱️ What happens if untreated?
                        </button>
                        <button
                          onClick={() => handleSendMessage("How can I manage the pain naturally?")}
                          className="block w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          🌿 Natural pain management?
                        </button>
                        <button
                          onClick={() => handleSendMessage("What tests should I consider getting?")}
                          className="block w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          🔬 What tests should I get?
                        </button>
                        {confidence < 90 && (
                          <button
                            onClick={() => handleSendMessage("I'd like more certainty about my diagnosis. Can you ask me more specific questions to increase the confidence level?")}
                            className="block w-full text-left px-4 py-3 text-sm bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 hover:from-emerald-600/30 hover:to-cyan-600/30 rounded-lg transition-colors"
                          >
                            🎯 Ask me more questions for higher confidence
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-purple-500/20 text-white'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-purple-400">Oracle AI</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-sm text-gray-400">Oracle is thinking...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input Section */}
                <div className="p-4 border-t border-gray-800">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                    <input
                      type="text"
                      value={oracleQuestion}
                      onChange={(e) => setOracleQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Ask about your diagnosis, symptoms, or treatment..."
                      disabled={isStreaming}
                      className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!oracleQuestion.trim() || isStreaming}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}