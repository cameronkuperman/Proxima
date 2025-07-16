'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Loader2, CheckCircle, MessageSquare, FileText } from 'lucide-react'
import QuickScanResults from './QuickScanResults'
import { deepDiveClient } from '@/lib/deepdive-client'
import { useAuth } from '@/contexts/AuthContext'
import { useTrackingStore } from '@/stores/useTrackingStore'

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

// Generate contextual questions based on symptoms and body part
const generateContextualQuestion = (bodyPart: string, symptoms: string, questionNumber: number): string => {
  const symptomLower = symptoms.toLowerCase()
  const bodyPartLower = bodyPart.toLowerCase()
  
  // Pain-related questions
  if (symptomLower.includes('pain') || symptomLower.includes('hurt') || symptomLower.includes('ache')) {
    const painQuestions = [
      `Can you describe the nature of the pain in your ${bodyPart}? Is it sharp, dull, throbbing, burning, or aching?`,
      `On a scale of 1-10, how would you rate the pain intensity? Does it vary throughout the day?`,
      `Does the pain radiate to other areas, or is it localized to just the ${bodyPart}?`
    ]
    return painQuestions[Math.min(questionNumber - 1, painQuestions.length - 1)]
  }
  
  // Movement/exercise related
  if (symptomLower.includes('exercise') || symptomLower.includes('workout') || symptomLower.includes('movement')) {
    const exerciseQuestions = [
      `Does the discomfort occur during specific exercises or movements? Which ones specifically?`,
      `How long after exercise does the symptom appear, and how long does it typically last?`,
      `Have you recently changed your workout routine or increased intensity?`
    ]
    return exerciseQuestions[Math.min(questionNumber - 1, exerciseQuestions.length - 1)]
  }
  
  // Body part specific fallbacks
  const bodyPartQuestions: Record<string, string[]> = {
    head: [
      "Does the pain feel throbbing, sharp, or like pressure? Is it on one side or both?",
      "Do you experience any vision changes, sensitivity to light, or nausea?",
      "What time of day is it worst? Do certain activities trigger it?"
    ],
    chest: [
      "Is the chest pain sharp, dull, or pressure-like? Does it change with breathing or movement?",
      "Does the pain worsen with physical activity, deep breathing, or certain positions?",
      "Have you experienced any shortness of breath, palpitations, or radiating pain to your arm or jaw?"
    ],
    pectoralis: [
      "Does the chest muscle pain occur during or after specific exercises like push-ups or bench press?",
      "Is the pain localized to the muscle area or does it feel deeper in your chest?",
      "Have you noticed any muscle weakness, swelling, or bruising in the affected area?"
    ],
    abdomen: [
      "Where exactly is the pain located? Upper, lower, left, or right side?",
      "Is the pain constant or does it come in waves? Does it relate to eating?",
      "Have you noticed any changes in bowel habits, appetite, or weight?"
    ],
    back: [
      "Is the pain in your upper, middle, or lower back? Does it affect one side more?",
      "Does the pain radiate down your legs or arms? Any numbness or tingling?",
      "What positions or activities make it better or worse?"
    ],
    leg: [
      "Is the discomfort in your thigh, calf, knee, or ankle area?",
      "Do you notice any swelling, warmth, or color changes in the affected area?",
      "Does the pain worsen with walking or improve with rest?"
    ],
    arm: [
      "Where in the arm is the issue? Shoulder, upper arm, elbow, or forearm?",
      "Do you have any weakness, numbness, or tingling sensations?",
      "Are certain movements or positions particularly painful?"
    ]
  }
  
  // Find the best match for body part
  for (const [key, questions] of Object.entries(bodyPartQuestions)) {
    if (bodyPartLower.includes(key)) {
      return questions[Math.min(questionNumber - 1, questions.length - 1)]
    }
  }
  
  // Generic fallback questions
  const genericQuestions = [
    `How long have you been experiencing these symptoms in your ${bodyPart}?`,
    `Have you tried any treatments or remedies? If so, what helped or didn't help?`,
    `Are there any other symptoms or changes you've noticed recently?`
  ]
  
  return genericQuestions[Math.min(questionNumber - 1, genericQuestions.length - 1)]
}

export default function DeepDiveChat({ scanData, onComplete }: DeepDiveChatProps) {
  const { user } = useAuth()
  const { generateSuggestion } = useTrackingStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializingRef = useRef(false)
  const processingRef = useRef(false)
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Initialize deep dive session with proper guards
  useEffect(() => {
    if (!isInitialized && !initializingRef.current) {
      initializeSession()
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeSession = async () => {
    // Prevent concurrent initialization
    if (initializingRef.current) return
    initializingRef.current = true
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Starting deep dive initialization...')
      
      // Try different models if we keep getting blank responses
      const models = [
        'deepseek/deepseek-r1-0528:free',
        'deepseek/deepseek-chat',
        'deepseek/deepseek-r1-distill-llama-70b:free'
      ]
      const modelToUse = retryCount < models.length ? models[retryCount] : models[models.length - 1]
      console.log(`Using model: ${modelToUse} (retry ${retryCount})`)
      
      const response = await deepDiveClient.startDeepDive(
        scanData.bodyPart,
        scanData.formData,
        user?.id,
        modelToUse
      )
      
      console.log('Deep Dive start response:', response)
      
      // Validate response has a question, use fallback if empty
      let questionToUse = response.question
      if (!questionToUse || questionToUse.trim() === '') {
        console.warn('Initial question was blank')
        
        // If we haven't tried all models yet, retry with a different one
        if (retryCount < 2) {
          console.log('Retrying with a different model...')
          setRetryCount(retryCount + 1)
          initializingRef.current = false
          setTimeout(() => initializeSession(), 500)
          return
        }
        
        // Use contextual fallback if all models failed
        console.warn('All models returned blank questions, using contextual fallback')
        questionToUse = generateContextualQuestion(
          scanData.bodyPart,
          scanData.formData.symptoms || '',
          1
        )
        console.log('Generated fallback question:', questionToUse)
      }
      
      // Batch state updates to prevent race conditions
      const timestamp = Date.now()
      const firstQuestion: Message = {
        id: `q1-${timestamp}`,
        role: 'assistant',
        content: questionToUse,
        timestamp: new Date()
      }
      
      // Set all state in one batch
      setSessionId(response.session_id)
      setCurrentQuestion(questionToUse)
      setQuestionCount(response.question_number || 1)
      setMessages([firstQuestion])
      setIsInitialized(true)
      
    } catch (error) {
      console.error('Failed to start deep dive:', error)
      
      // If all retries failed, show a user-friendly error
      if (retryCount >= 2) {
        setError('Unable to start the deep dive analysis. Please try again later.')
        
        // Create a mock session with fallback questions
        const mockSessionId = `mock-${Date.now()}`
        setSessionId(mockSessionId)
        
        const fallbackQuestion = generateContextualQuestion(
          scanData.bodyPart,
          scanData.formData.symptoms || '',
          1
        )
        
        const firstQuestion: Message = {
          id: `q1-${Date.now()}`,
          role: 'assistant',
          content: fallbackQuestion,
          timestamp: new Date()
        }
        
        setCurrentQuestion(fallbackQuestion)
        setQuestionCount(1)
        setMessages([firstQuestion])
        setIsInitialized(true)
      } else {
        // Retry with different model
        setRetryCount(retryCount + 1)
        initializingRef.current = false
        setTimeout(() => initializeSession(), 500)
        return
      }
    } finally {
      setIsLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading || !sessionId || processingRef.current) return

    // Prevent concurrent submissions
    processingRef.current = true
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
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
      
      console.log('Deep Dive continue response:', JSON.stringify(response, null, 2))
      console.log('Question received:', response.question)
      console.log('Question is blank:', !response.question || response.question.trim() === '')
      console.log('Response structure:', {
        hasQuestion: !!response.question,
        questionLength: response.question?.length || 0,
        questionNumber: response.question_number,
        readyForAnalysis: response.ready_for_analysis
      })
      
      if (response.ready_for_analysis) {
        // Complete the deep dive
        console.log('Ready for analysis, calling completeDeepDive')
        await completeDeepDive()
      } else if (response.question && response.question.trim() !== '') {
        // Continue with next question
        setError(null) // Clear any previous errors
        
        // Add a small delay to ensure state updates properly
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const nextQuestionNumber = response.question_number || questionCount + 1
        const assistantMessage: Message = {
          id: `q${nextQuestionNumber}-${Date.now()}`,
          role: 'assistant',
          content: response.question,
          timestamp: new Date()
        }
        
        // Batch update state
        setQuestionCount(nextQuestionNumber)
        setCurrentQuestion(response.question)
        setMessages(prev => [...prev, assistantMessage])
      } else if (!response.question || response.question.trim() === '') {
        // Check if we've asked enough questions
        if (questionCount >= 3) {
          console.log('Reached maximum questions (3), completing analysis')
          await completeDeepDive()
          return
        }
        
        // No valid question but not ready for analysis - use fallback
        console.warn('Received empty question, using contextual fallback')
        const fallbackQuestion = generateContextualQuestion(
          scanData.bodyPart,
          scanData.formData.symptoms || '',
          questionCount + 1
        )
        console.log('Generated fallback question:', fallbackQuestion)
        
        const nextQuestionNumber = questionCount + 1
        const assistantMessage: Message = {
          id: `q${nextQuestionNumber}-${Date.now()}`,
          role: 'assistant',
          content: fallbackQuestion,
          timestamp: new Date()
        }
        
        setQuestionCount(nextQuestionNumber)
        setCurrentQuestion(fallbackQuestion)
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
      processingRef.current = false
    }
  }


  const completeDeepDive = async () => {
    console.log('completeDeepDive called with sessionId:', sessionId)
    setIsLoading(true)
    const completionMessage: Message = {
      id: `completion-${Date.now()}`,
      role: 'assistant',
      content: "Thank you for providing detailed information. I'm now analyzing all your responses to create a comprehensive health assessment...",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, completionMessage])

    try {
      console.log('Calling deepDiveClient.completeDeepDive')
      const result = await deepDiveClient.completeDeepDive(sessionId!)
      console.log('Deep Dive complete result:', result)
      
      // Validate the result has required data
      if (!result || !result.analysis) {
        throw new Error('Invalid analysis result received')
      }
      
      setFinalAnalysis({
        ...scanData,
        analysis: result.analysis || {},
        confidence: result.confidence || 0,
        scan_id: result.deep_dive_id || null,
        questions_asked: result.questions_asked || 0,
        reasoning_snippets: result.reasoning_snippets || []
      })
      setIsComplete(true)
      onComplete(result.analysis)
      
      // Generate tracking suggestion
      if (result.deep_dive_id && user?.id) {
        await generateSuggestion('deep_dive', result.deep_dive_id, user.id)
      }
      
      // Add final diagnosis message with proper null checking
      const primaryCondition = result.analysis?.primaryCondition || 'Unknown Condition'
      const likelihood = result.analysis?.likelihood || 'Analysis complete'
      const confidenceText = result.confidence >= 80 ? ` (${result.confidence}% confidence)` : ''
      
      const diagnosisMessage: Message = {
        id: `diagnosis-${Date.now()}`,
        role: 'assistant',
        content: `Based on your symptoms, this looks like **${primaryCondition}**${confidenceText}. ${likelihood}`,
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

  // Show loading state during initialization
  if (!isInitialized && isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900/50 rounded-3xl border border-white/10 overflow-hidden p-8">
          <div className="text-center">
            <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lg text-white mb-2">Initializing Deep Dive Analysis...</p>
            <p className="text-sm text-gray-400">Preparing personalized questions based on your symptoms</p>
          </div>
        </div>
      </div>
    )
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
        <div className="h-[400px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Brain className="w-8 h-8 text-indigo-400 mx-auto mb-4" />
              <p className="text-gray-400">Preparing personalized health questions...</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
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
                  {message.id.startsWith('diagnosis-') ? (
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
                    <p className="text-sm leading-relaxed">
                      {message.content && message.content.trim() !== '' 
                        ? message.content 
                        : "I'm preparing a question for you..."}
                    </p>
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
        {!isComplete && currentQuestion && currentQuestion.trim() !== '' && (
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
        {!isComplete && messages.length >= 3 && (!currentQuestion || currentQuestion.trim() === '') && !isLoading && (
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