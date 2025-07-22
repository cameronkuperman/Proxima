'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, AlertCircle, Sparkles, Send, ChevronDown, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OracleAIModalProps {
  isOpen: boolean
  onClose: () => void
  analysisData: any
  bodyPart: string
}

export default function OracleAIModal({ isOpen, onClose, analysisData, bodyPart }: OracleAIModalProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'carePlan' | 'watchFor'>('diagnosis')
  const [oracleQuestion, setOracleQuestion] = useState('')
  const [showWhyDiagnosis, setShowWhyDiagnosis] = useState(false)
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])  
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const confidence = analysisData?.confidence || 65
  const diagnosis = analysisData?.diagnosis || 'Muscle Strain (pulled muscle)'
  const otherPossibilities = analysisData?.other_possibilities || [
    { name: 'Costochondritis (inflammation of rib cartilage)', likelihood: 30 },
    { name: 'Muscle Strain (pulled muscle)', likelihood: 60 },
    { name: 'Muscle Spasm', likelihood: 20 }
  ]
  
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
        diagnosis: analysisData.diagnosis,
        confidence: analysisData.confidence,
        bodyPart: bodyPart,
        differentials: analysisData.other_possibilities,
        reasoning: analysisData.reasoning || 'Based on the symptoms and examination'
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,  // Backend now supports this
          query: question,    // Backwards compatibility
          context: `Patient has been diagnosed with ${context.diagnosis} (${context.confidence}% confidence) affecting the ${context.bodyPart}. Other possibilities include: ${context.differentials.map((d: any) => `${d.name} (${d.likelihood}%)`).join(', ')}.`,
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
            className="fixed inset-4 md:inset-[5%] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Your Health Analysis</h2>
                <p className="text-gray-400">Analysis for {bodyPart} symptoms</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-400">{confidence}%</div>
                  <div className="text-xs text-gray-400">Initial Confidence</div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'diagnosis' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Diagnosis
              {activeTab === 'diagnosis' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('carePlan')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'carePlan' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Care Plan
              {activeTab === 'carePlan' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('watchFor')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'watchFor' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Watch For
              {activeTab === 'watchFor' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'diagnosis' && (
              <div className="space-y-6">
                {/* Most Likely Condition */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Most Likely Condition</p>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{diagnosis}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 text-xs rounded">
                          Possible
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWhyDiagnosis(!showWhyDiagnosis)}
                      className="mt-3 text-orange-400 text-sm flex items-center gap-1 hover:text-orange-300"
                    >
                      Why this diagnosis?
                      <ChevronDown className={`w-4 h-4 transition-transform ${showWhyDiagnosis ? 'rotate-180' : ''}`} />
                    </button>
                    {showWhyDiagnosis && (
                      <div className="mt-3 text-sm text-gray-300 pt-3 border-t border-gray-700">
                        {analysisData?.reasoning || 'Based on the symptoms you described and the location of pain, muscle strain is the most likely cause.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Possibilities */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Other Possibilities</p>
                  <div className="space-y-3">
                    {otherPossibilities.map((possibility: any, index: number) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">{possibility.name}</span>
                          <span className="text-xs text-gray-400">{possibility.likelihood}% likely</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 1 ? 'bg-purple-500' : 'bg-gray-600'
                            }`}
                            style={{ width: `${possibility.likelihood}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                    <p className="text-sm text-gray-300">
                      Low confidence - consider deeper analysis
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                      🤿 Dive Deeper
                    </button>
                    <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                      🧠 Think Harder
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      📋 Generate Detailed Report
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      📈 Track Over Time
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      🤖 Get a deeper analysis with Oracle AI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'carePlan' && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-purple-400 mb-3">Immediate Care</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Rest the affected area</li>
                    <li>• Apply ice for 15-20 minutes every 2-3 hours</li>
                    <li>• Take over-the-counter pain medication as directed</li>
                  </ul>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-purple-400 mb-3">Recovery Timeline</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Initial improvement:</span>
                      <span className="text-purple-300">2-3 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Significant relief:</span>
                      <span className="text-purple-300">1 week</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Full recovery:</span>
                      <span className="text-purple-300">2-3 weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'watchFor' && (
              <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Seek Immediate Care If:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Severe pain that suddenly worsens</li>
                    <li>• Numbness or tingling in extremities</li>
                    <li>• Difficulty breathing or chest tightness</li>
                    <li>• Fever above 101°F (38.3°C)</li>
                  </ul>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-400 mb-3">Monitor Closely:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Pain that doesn't improve with rest</li>
                    <li>• Swelling that increases</li>
                    <li>• New symptoms developing</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Oracle AI Section */}
          <div className="border-t border-gray-800 bg-gray-950 flex flex-col" style={{ height: '300px' }}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Oracle AI Assistant</h3>
                  <p className="text-sm text-gray-400">Ask follow-up questions about your analysis</p>
                </div>
              </div>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Ask me anything about your diagnosis, symptoms, or treatment options.</p>
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleSendMessage("What lifestyle changes can help with my condition?")}
                      className="block w-full text-left px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      💡 What lifestyle changes can help?
                    </button>
                    <button
                      onClick={() => handleSendMessage("Should I see a specialist for this?")}
                      className="block w-full text-left px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      👨‍⚕️ Should I see a specialist?
                    </button>
                    <button
                      onClick={() => handleSendMessage("What are the long-term effects if untreated?")}
                      className="block w-full text-left px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ⏱️ What happens if untreated?
                    </button>
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
                    className={`max-w-[80%] rounded-lg p-3 ${
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

          {/* Bottom Button */}
          <div className="p-4 border-t border-gray-800">
            <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
              Start New Scan
            </button>
          </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}