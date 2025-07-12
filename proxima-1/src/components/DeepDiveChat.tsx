'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Loader2, CheckCircle, MessageSquare, FileText } from 'lucide-react'
import QuickScanResults from './QuickScanResults'
import { deepDiveClient } from '@/lib/deepdive-client'
import { useAuth } from '@/contexts/AuthContext'

interface DeepDiveChatProps {
  scanData: {
    bodyPart: string
    formData: any
    mode: 'deep'
  }
  onComplete: (finalAnalysis: any) => void
}

interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export default function DeepDiveChat({ scanData, onComplete }: DeepDiveChatProps) {
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  // Initialize deep dive session
  useEffect(() => {
    initializeSession()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeSession = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await deepDiveClient.startDeepDive(
        scanData.bodyPart,
        scanData.formData,
        user?.id
      )
      
      console.log('Deep Dive start response:', response)
      
      setSessionId(response.session_id)
      setCurrentQuestion(response.question)
      setQuestionCount(response.question_number || 1)
      setMessages([{
        id: '1',
        role: 'assistant',
        content: response.question,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to start deep dive:', error)
      setError(error instanceof Error ? error.message : 'Failed to start deep dive')
    } finally {
      setIsLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsLoading(true)

    try {
      const response = await deepDiveClient.continueDeepDive(
        sessionId!,
        userMessage.content,
        questionCount
      )
      
      console.log('Deep Dive continue response:', response)
      
      if (response.ready_for_analysis) {
        // Complete the deep dive
        console.log('Ready for analysis, calling completeDeepDive')
        await completeDeepDive()
      } else if (response.question) {
        // Continue with next question
        setError(null) // Clear any previous errors
        setQuestionCount(response.question_number!)
        setCurrentQuestion(response.question)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.question,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // No more questions and ready_for_analysis might be implicitly true
        console.log('No more questions, attempting to complete')
        await completeDeepDive()
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setError(error instanceof Error ? error.message : 'Failed to process answer')
    } finally {
      setIsLoading(false)
    }
  }


  const completeDeepDive = async () => {
    console.log('completeDeepDive called with sessionId:', sessionId)
    setIsLoading(true)
    const completionMessage: Message = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content: "Thank you for providing detailed information. I'm now analyzing all your responses to create a comprehensive health assessment...",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, completionMessage])

    try {
      console.log('Calling deepDiveClient.completeDeepDive')
      const result = await deepDiveClient.completeDeepDive(sessionId!)
      console.log('Deep Dive complete result:', result)
      
      setFinalAnalysis({
        ...scanData,
        analysis: result.analysis,
        confidence: result.confidence,
        scan_id: result.deep_dive_id,
        questions_asked: result.questions_asked,
        reasoning_snippets: result.reasoning_snippets
      })
      setIsComplete(true)
      onComplete(result.analysis)
      
      // Add final diagnosis message
      const confidenceText = result.confidence >= 80 ? ` (${result.confidence}% confidence)` : ''
      const diagnosisMessage: Message = {
        id: 'diagnosis-msg',
        role: 'assistant',
        content: `Based on your symptoms, this looks like **${result.analysis.primaryCondition}**${confidenceText}. ${result.analysis.likelihood}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, diagnosisMessage])
      
      // Generate summary if user is authenticated
      if (user?.id && result.deep_dive_id) {
        deepDiveClient.generateSummary(result.deep_dive_id, user.id).catch(err => {
          console.warn('Summary generation failed:', err)
        })
      }
    } catch (error) {
      console.error('Failed to complete deep dive:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete analysis')
    } finally {
      setIsLoading(false)
    }
  }

  if (showReport && finalAnalysis) {
    console.log('Rendering QuickScanResults with finalAnalysis:', finalAnalysis)
    return <QuickScanResults scanData={finalAnalysis} onNewScan={() => window.location.reload()} />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Deep Dive Analysis</h3>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < questionCount
                        ? 'bg-indigo-400'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                Question {questionCount} of 2-3
              </span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-[400px] overflow-y-auto p-6 space-y-4" key={`chat-${messages.length}`}>
          <AnimatePresence mode="wait">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-500/20 text-white'
                      : 'bg-gray-800/50 text-gray-300'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs text-indigo-400 font-medium">AI Assistant</span>
                    </div>
                  )}
                  {message.id === 'diagnosis-msg' ? (
                    <div>
                      <p className="text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ 
                        __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') 
                      }} />
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => setShowReport(true)}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FileText className="w-5 h-5" />
                        View Full Analysis Report
                      </motion.button>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-sm text-gray-400">Analyzing your response...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        {!isComplete && currentQuestion && (
          <form onSubmit={handleSubmit} className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                disabled={isLoading}
                rows={2}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder-gray-500 disabled:opacity-50 resize-none"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Provide detailed answers to help us better understand your condition
            </p>
          </form>
        )}
        
        {/* Manual complete button after sufficient Q&A */}
        {!isComplete && messages.length >= 3 && !currentQuestion && !isLoading && (
          <div className="p-4 text-center border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">
              Ready to generate your comprehensive health analysis?
            </p>
            <button
              onClick={() => completeDeepDive()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              Generate Analysis Report
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-indigo-400 mb-1">Why these questions?</h4>
            <p className="text-xs text-gray-400">
              Each question is carefully selected based on your symptoms to help identify patterns, 
              rule out serious conditions, and provide the most accurate health guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}