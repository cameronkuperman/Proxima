'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Loader2, CheckCircle, MessageSquare, FileText } from 'lucide-react'
import GeneralDeepDiveResult from './results/GeneralDeepDiveResult'
import { generalAssessmentClient } from '@/lib/general-assessment-client'
import { useAuth } from '@/contexts/AuthContext'
import ErrorAlert from './ErrorAlert'

interface GeneralDeepDiveChatProps {
  scanData: {
    category: string
    formData: any
    mode: 'deep'
    source: 'general'
  }
  onComplete: (finalAnalysis: any) => void
}

interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export default function GeneralDeepDiveChat({ scanData, onComplete }: GeneralDeepDiveChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [finalResults, setFinalResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start deep dive session
  useEffect(() => {
    startDeepDive()
  }, [])

  const startDeepDive = async () => {
    setIsLoading(true)
    try {
      const response = await generalAssessmentClient.startGeneralDeepDive(
        scanData.category,
        scanData.formData,
        user?.id
      )
      
      if (response.status === 'success') {
        setSessionId(response.session_id)
        setCurrentQuestion(response.question)
        setQuestionNumber(1)
        
        // Add first question to messages
        setMessages([{
          id: `q-1`,
          role: 'assistant',
          content: response.question,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Failed to start deep dive:', error)
      setError('Failed to start the assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: `u-${questionNumber}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await generalAssessmentClient.continueGeneralDeepDive(
        sessionId,
        inputValue,
        questionNumber
      )
      console.log('Continue response:', response)

      if (response.ready_for_analysis) {
        console.log('Ready for analysis - completing deep dive')
        // Complete the deep dive
        completeDeepDive()
      } else if (response.question) {
        console.log('Got next question:', response.question)
        // Add next question
        setCurrentQuestion(response.question)
        setQuestionNumber(response.question_number)
        
        const assistantMessage: Message = {
          id: `q-${response.question_number}`,
          role: 'assistant',
          content: response.question,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        console.warn('Unexpected response - no question and not ready for analysis:', response)
        // If no more questions and response indicates completion differently
        if (!response.question && (response.is_final_question || response.status === 'success')) {
          console.log('Detected completion through alternative response structure')
          completeDeepDive()
        }
      }
    } catch (error) {
      console.error('Failed to continue deep dive:', error)
      setError('Failed to process your response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const completeDeepDive = async () => {
    setIsLoading(true)
    const completionMessage: Message = {
      id: 'completion',
      role: 'assistant',
      content: 'I have all the information I need. Let me analyze your responses and provide a comprehensive assessment...',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, completionMessage])

    try {
      console.log('Completing deep dive with sessionId:', sessionId)
      const response = await generalAssessmentClient.completeGeneralDeepDive(sessionId!)
      console.log('Deep dive complete response:', response)
      
      if (response.status === 'success') {
        console.log('Setting final results and marking as complete')
        setFinalResults(response)
        setIsComplete(true)
        onComplete(response)
      } else {
        console.error('Deep dive response status not success:', response)
        setError('Assessment completed but with unexpected status')
      }
    } catch (error) {
      console.error('Failed to complete deep dive:', error)
      setError('Failed to complete the assessment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show final results if complete
  if (isComplete && finalResults) {
    return (
      <GeneralDeepDiveResult 
        result={finalResults}
        category={scanData.category}
        messages={messages}
        onNewAssessment={() => {
          // Reset state
          setMessages([])
          setSessionId(null)
          setIsComplete(false)
          setFinalResults(null)
          setQuestionNumber(0)
        }}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ErrorAlert error={error} onClose={() => setError(null)} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deep Dive Assessment</h2>
            <p className="text-gray-400">Category: {scanData.category}</p>
          </div>
        </div>
        <div className="w-full bg-white/[0.05] rounded-full h-2">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / 5) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Chat Container */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-500/20' 
                        : 'bg-indigo-500/20'
                    }`}>
                      {message.role === 'user' ? (
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Brain className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-xl ${
                      message.role === 'user'
                        ? 'bg-blue-500/20 text-white'
                        : 'bg-white/[0.05] text-gray-200'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && !isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gray-400"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t border-white/[0.05] p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
              disabled={isLoading || isComplete}
              className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
            />
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isComplete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send
                  <Send className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-400 text-sm mt-4"
      >
        {questionNumber === 0 
          ? 'Starting your personalized health assessment...'
          : `Question ${questionNumber} of approximately 5`
        }
      </motion.p>
    </div>
  )
}