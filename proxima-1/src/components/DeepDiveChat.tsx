'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Loader2, CheckCircle, MessageSquare, FileText } from 'lucide-react'
import QuickScanResults from './QuickScanResults'
import { deepDiveClient } from '@/lib/deepdive-client'
import { useAuth } from '@/contexts/AuthContext'
import { useTrackingStore } from '@/stores/useTrackingStore'
import { useAuditLog } from '@/hooks/useAuditLog'

interface DeepDiveChatProps {
  scanData: {
    bodyPart: string
    formData: any
    mode: 'deep'
    continueSession?: string
    targetConfidence?: number
    fromScan?: string
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
  const { logEvent } = useAuditLog()
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
  const [analysisReady, setAnalysisReady] = useState(false)
  const [finalAnalysis, setFinalAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [autoShowResults, setAutoShowResults] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isThinkingHarder, setIsThinkingHarder] = useState(false)
  const [isAskingMore, setIsAskingMore] = useState(false)
  const [askMoreQuestionCount, setAskMoreQuestionCount] = useState(0)
  const [currentConfidence, setCurrentConfidence] = useState(85)

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
      // Check if we're continuing an existing session
      if (scanData.continueSession) {
        console.log('Continuing existing session:', scanData.continueSession)
        
        setSessionId(scanData.continueSession)
        setCurrentConfidence(85) // Default starting confidence for continuing session
        
        // Call askMeMore to get additional questions
        const askMoreResponse = await deepDiveClient.askMeMore(
          scanData.continueSession,
          85, // current confidence
          scanData.targetConfidence || 95,
          user?.id,
          5 // max questions
        )
        
        if (askMoreResponse.status === 'completed' || !askMoreResponse.question) {
          // Session already at target confidence
          setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: `Your analysis has already reached ${askMoreResponse.current_confidence || 90}% confidence. No additional questions needed.`,
            timestamp: new Date()
          }])
          setAnalysisReady(true)
          setIsLoading(false)
          initializingRef.current = false
          return
        }
        
        // Set up the first question from askMeMore
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: askMoreResponse.question,
          timestamp: new Date()
        }
        setMessages([assistantMessage])
        setCurrentQuestion(askMoreResponse.question)
        setQuestionCount(askMoreResponse.question_number || 1)
        setIsAskingMore(true)
        setCurrentConfidence(askMoreResponse.current_confidence || 85)
        
        setIsInitialized(true)
        setIsLoading(false)
        initializingRef.current = false
        return
      }
      
      console.log('Starting new deep dive session...')
      
      // Try different models if we keep getting blank responses
      const models = [
        'tngtech/deepseek-r1t-chimera:free',  // Updated primary model
        'openai/gpt-4-turbo',
        'anthropic/claude-3-sonnet',
        'deepseek/deepseek-chat'
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
        if (retryCount < 3) {
          console.log('Retrying with a different model...')
          setRetryCount(retryCount + 1)
          initializingRef.current = false
          setTimeout(() => initializeSession(), 1000 * (retryCount + 1)) // Exponential backoff
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
      
      // Log deep dive started
      if (user?.id) {
        await logEvent('DEEP_DIVE_STARTED', {
          session_id: response.session_id,
          body_part: scanData.bodyPart,
          model: modelToUse,
          from_scan: scanData.fromScan || undefined,
        })
      }
      
    } catch (error) {
      console.error('Failed to start deep dive:', error)
      
      // If all retries failed, show a user-friendly error
      if (retryCount >= 3) {
        let errorMessage = 'Our AI models are experiencing high demand. Please try again in a moment.'
        if (error instanceof Error && error.message.includes('Model failed')) {
          errorMessage = 'Having trouble connecting to our AI. Trying alternative analysis methods...'
        }
        setError(errorMessage)
        
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
        setTimeout(() => initializeSession(), 1000 * (retryCount + 1)) // Exponential backoff
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
        questionCount,
        'deepseek/deepseek-chat'  // Fallback model
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
      
      if (response.ready_for_analysis && questionCount < 2) {
        // Backend says ready but we need at least 2 questions for proper diagnosis
        console.log(`Backend ready after ${questionCount} questions, forcing more questions for accuracy`)
        
        // Force another question by continuing
        const forcedResponse = await deepDiveClient.continueDeepDive(
          sessionId!,
          "I need more details to provide an accurate assessment. Please continue.",
          questionCount,
          'deepseek/deepseek-chat'
        )
        
        console.log('Forced continue response:', forcedResponse)
        
        if (forcedResponse.question && forcedResponse.question.trim() !== '') {
          const nextQuestionNumber = forcedResponse.question_number || questionCount + 1
          const assistantMessage: Message = {
            id: `q${nextQuestionNumber}-${Date.now()}`,
            role: 'assistant',
            content: forcedResponse.question,
            timestamp: new Date()
          }
          
          setQuestionCount(nextQuestionNumber)
          setCurrentQuestion(forcedResponse.question)
          setMessages(prev => [...prev, assistantMessage])
        } else {
          // If we still can't get a question, then mark as ready
          console.log('Could not force more questions, marking as ready')
          setAnalysisReady(true)
          setCurrentQuestion('')
          
          const readyMessage: Message = {
            id: `ready-${Date.now()}`,
            role: 'assistant',
            content: 'I have gathered enough information. Click the button below to generate your comprehensive health analysis.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, readyMessage])
        }
      } else if (response.ready_for_analysis) {
        // We have at least 2 questions, can complete
        console.log(`Ready for analysis after ${questionCount} questions`)
        setAnalysisReady(true)
        setCurrentQuestion('')
        
        // Show a message to the user
        const readyMessage: Message = {
          id: `ready-${Date.now()}`,
          role: 'assistant',
          content: 'I have gathered enough information. Click the button below to generate your comprehensive health analysis.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, readyMessage])
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
        
        // Confidence is tracked separately in Ask Me More flow
      } else if (!response.question || response.question.trim() === '') {
        // Check if we've asked enough questions
        if (questionCount >= 2) {
          console.log(`No more questions after ${questionCount} questions, ready for analysis`)
          setAnalysisReady(true)
          setCurrentQuestion('')
          
          const readyMessage: Message = {
            id: `ready-${Date.now()}`,
            role: 'assistant',
            content: 'I have gathered enough information. Click the button below to generate your comprehensive health analysis.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, readyMessage])
          return
        }
        
        // Need more questions but backend returned empty - try again with different model
        console.warn('Received empty question, retrying with different model')
        
        try {
          const retryResponse = await deepDiveClient.continueDeepDive(
            sessionId!,
            "Please provide more details about your symptoms.",
            questionCount,
            'openai/gpt-4-turbo'  // Try different model
          )
          
          if (retryResponse.question && retryResponse.question.trim() !== '') {
            const nextQuestionNumber = retryResponse.question_number || questionCount + 1
            const assistantMessage: Message = {
              id: `q${nextQuestionNumber}-${Date.now()}`,
              role: 'assistant',
              content: retryResponse.question,
              timestamp: new Date()
            }
            
            setQuestionCount(nextQuestionNumber)
            setCurrentQuestion(retryResponse.question)
            setMessages(prev => [...prev, assistantMessage])
          } else {
            // Still no question, mark as ready if we have at least 1 question
            console.log('Could not get more questions from backend')
            if (questionCount >= 1) {
              setAnalysisReady(true)
              setCurrentQuestion('')
              
              const readyMessage: Message = {
                id: `ready-${Date.now()}`,
                role: 'assistant',
                content: 'I have gathered initial information. Click the button below to generate your health analysis.',
                timestamp: new Date()
              }
              setMessages(prev => [...prev, readyMessage])
            }
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError)
          // If retry fails and we have at least 1 question, allow completion
          if (questionCount >= 1) {
            setAnalysisReady(true)
            setCurrentQuestion('')
            
            const readyMessage: Message = {
              id: `ready-${Date.now()}`,
              role: 'assistant',
              content: 'I have gathered initial information. Click the button below to generate your health analysis.',
              timestamp: new Date()
            }
            setMessages(prev => [...prev, readyMessage])
          }
        }
      } else {
        // No more questions, show complete button
        console.log('No more questions, ready for analysis')
        setAnalysisReady(true)
        setCurrentQuestion('')
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      
      // Handle specific error messages from backend
      let errorMessage = 'Failed to process answer'
      if (error instanceof Error) {
        if (error.message.includes('Session not found')) {
          errorMessage = 'Your session has expired. Please start a new analysis.'
        } else if (error.message.includes('Session already completed')) {
          errorMessage = 'This analysis is finalized. Start a new Deep Dive for further questions.'
        } else if (error.message.includes('Maximum additional questions')) {
          errorMessage = 'You\'ve asked the maximum number of follow-up questions. Please review your analysis.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
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
      const result = await deepDiveClient.completeDeepDive(
        sessionId!,
        undefined,
        'deepseek/deepseek-chat'  // Fallback model - more reliable for JSON
      )
      console.log('Deep Dive complete result:', result)
      console.log('Analysis type:', typeof result.analysis)
      console.log('Analysis object:', result.analysis)
      
      // Validate the result has required data
      if (!result || !result.analysis) {
        console.error('Invalid result structure:', result)
        throw new Error('Invalid analysis result received')
      }
      
      // Ensure analysis is an object, not a string
      if (typeof result.analysis === 'string') {
        console.error('ERROR: Backend returned analysis as string, should be object!')
        throw new Error('Backend returned invalid analysis format')
      }
      
      const finalData = {
        ...scanData,
        analysis: result.analysis || {},
        confidence: result.confidence || 0,
        scan_id: result.deep_dive_id || null,
        deep_dive_id: result.deep_dive_id || null,  // Add this for Think Harder
        questions_asked: result.questions_asked || 0,
        reasoning_snippets: result.reasoning_snippets || [],
        mode: 'deep'  // Ensure mode is set
      }
      
      setFinalAnalysis(finalData)
      setIsComplete(true)
      setAnalysisReady(false) // Reset this since we've completed
      onComplete(result.analysis)
      
      // Log deep dive completed
      if (user?.id) {
        await logEvent('DEEP_DIVE_COMPLETED', {
          session_id: sessionId,
          deep_dive_id: result.deep_dive_id,
          body_part: result.body_part,
          questions_asked: result.questions_asked,
          confidence: result.confidence,
        })
      }
      
      // Auto-show results like Quick Scan
      console.log('Auto-showing Deep Dive results')
      setShowReport(true)
      
      // Generate tracking suggestion only if not continuing from a quick scan
      // (Quick scan already generated its own tracking suggestion)
      if (result.deep_dive_id && user?.id && !scanData.fromScan) {
        console.log('[DeepDiveChat] Generating tracking suggestion for deep dive:', result.deep_dive_id)
        await generateSuggestion('deep_dive', result.deep_dive_id, user.id)
      } else if (scanData.fromScan) {
        console.log('[DeepDiveChat] Skipping tracking suggestion - continuing from quick scan:', scanData.fromScan)
      }
      
      // Add final diagnosis message with proper null checking
      const primaryCondition = result.analysis?.primaryCondition || 'Unknown Condition'
      const likelihood = result.analysis?.likelihood || 'Analysis complete'
      const confidenceText = result.confidence >= 80 ? ` (${result.confidence}% confidence)` : ''
      
      const diagnosisMessage: Message = {
        id: `diagnosis-${Date.now()}`,
        role: 'assistant',
        content: `Based on your symptoms, this looks like **${primaryCondition}**${confidenceText}. ${likelihood}\n\nGenerating your comprehensive analysis report...`,
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

  const handleThinkHarder = async () => {
    console.log('Deep Dive Ultra Think clicked, finalAnalysis:', finalAnalysis)
    const deepDiveId = finalAnalysis?.deep_dive_id || sessionId
    if (!deepDiveId) {
      console.error('No deep_dive ID available:', finalAnalysis)
      alert('Unable to enhance analysis - ID not found. Please complete the analysis first.')
      return
    }
    if (isThinkingHarder) return
    
    setIsThinkingHarder(true)
    setError(null)
    
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: "🧠 Engaging Grok 4's ultra-advanced reasoning capabilities. This sophisticated analysis may take a moment...",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, thinkingMessage])
    
    try {
      // Use Ultra Think endpoint with Grok 4 for Deep Dive
      const result = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app'}/api/deep-dive/ultra-think`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: deepDiveId,  // Backend expects session_id
          user_id: user?.id,
          model: 'x-ai/grok-4'
        })
      })
      
      if (!result.ok) {
        throw new Error('Failed to get ultra analysis')
      }
      
      const data = await result.json()
      console.log('Deep Dive Ultra Think response:', data)
      
      // Update with ultra analysis - match backend response format
      setFinalAnalysis((prev: any) => ({
        ...prev,
        ultra_analysis: data.ultra_analysis || data,
        confidence: data.ultra_analysis?.confidence || data.confidence_progression?.ultra || prev.confidence,
        ultra_confidence: data.ultra_analysis?.confidence || data.confidence_progression?.ultra,
        confidence_progression: data.confidence_progression,
        reasoning_snippets: data.reasoning_snippets || [],
        critical_insights: data.critical_insights || data.ultra_analysis?.critical_insights || [],
        complexity_score: data.complexity_score || data.ultra_analysis?.complexity_score,
        analysis_tier: data.analysis_tier,
        total_confidence_gain: data.total_confidence_gain
      }))
      
      // Extract key insights
      const insights = data.critical_insights || data.ultra_analysis?.critical_insights || []
      const complexityScore = data.complexity_score || data.ultra_analysis?.complexity_score || 'N/A'
      const ultraConfidence = data.ultra_analysis?.confidence || data.confidence || 95
      
      const enhancedMessage: Message = {
        id: `ultra-${Date.now()}`,
        role: 'assistant',
        content: `**Grok 4 Ultra Analysis Complete** 🧠✨\n\n**Confidence:** ${ultraConfidence}% (Case Complexity: ${complexityScore}/10)\n\n**Critical Insights:**\n${insights.map((insight: string, i: number) => `${i + 1}. ${insight}`).join('\n')}\n\n${data.recommendation_change ? `**Updated Recommendation:** ${data.recommendation_change}` : ''}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, enhancedMessage])
      
    } catch (error) {
      console.error('Think Harder failed:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble accessing Grok 4 right now. The original analysis remains accurate.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsThinkingHarder(false)
    }
  }

  const handleAskMeMore = async () => {
    
    if (!sessionId) {
      console.error('No session ID available for Ask Me More')
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Session not found. Please complete the initial analysis first.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
      return
    }
    
    
    if (isAskingMore) return
    
    // Check if we already have a final analysis (session might be closed)
    if (finalAnalysis) {
      console.log('Session already finalized, cannot ask more questions')
      const infoMsg: Message = {
        id: `info-${Date.now()}`,
        role: 'assistant',
        content: 'The analysis has already been completed. To ask more questions, please start a new deep dive session.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, infoMsg])
      return
    }
    
    setIsAskingMore(true)
    setError(null)
    setIsComplete(false) // Re-enable input form
    setAnalysisReady(false) // Reset analysis ready state
    
    const moreQuestionsMessage: Message = {
      id: `more-questions-${Date.now()}`,
      role: 'assistant',
      content: "I'd like to ask you a few more targeted questions to reach 90%+ diagnostic confidence. This will help provide even more accurate insights.",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, moreQuestionsMessage])
    
    try {
      // Get current confidence from the last response or use default
      const currentConfidenceLevel = currentConfidence || finalAnalysis?.confidence || 85
      
      // Call backend API for "Ask Me More" functionality
      const result = await deepDiveClient.askMeMore(
        sessionId,
        currentConfidenceLevel,
        95,  // Target 95% confidence as per backend guide default
        user?.id,
        5    // Max 5 additional questions
      )
      
      if (result.question) {
        // We got a new question!
        console.log('Ask Me More Success - New Question:', {
          question_number: result.question_number,
          category: result.question_category,
          expected_gain: result.expected_confidence_gain,
          current_confidence: result.current_confidence,
          target_confidence: result.target_confidence,
          questions_remaining: result.max_questions_remaining
        })
        
        const newQuestion: Message = {
          id: `additional-q-${Date.now()}`,
          role: 'assistant',
          content: result.question,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, newQuestion])
        setCurrentQuestion(result.question)
        setQuestionCount(result.question_number || questionCount + 1)
        setAskMoreQuestionCount(prev => prev + 1)
        setCurrentConfidence(result.current_confidence || currentConfidenceLevel)
        
        // Re-enable the chat for answering
        setAnalysisReady(false)
        setIsComplete(false)
        
      } else if (result.should_finalize) {
        // Hit max additional questions
        const maxQuestionsMessage: Message = {
          id: `max-questions-${Date.now()}`,
          role: 'assistant',
          content: result.message || `I've asked ${result.questions_asked || 5} additional questions. While we've reached ${result.current_confidence}% confidence (target: ${result.target_confidence}%), I'll generate a comprehensive analysis with the detailed information gathered.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, maxQuestionsMessage])
        
        // If didn't reach target, suggest Ultra Think
        if (result.current_confidence < result.target_confidence) {
          const ultraThinkSuggestion: Message = {
            id: `ultra-suggest-${Date.now()}`,
            role: 'assistant',
            content: `💡 Tip: For even higher confidence, try "Ultra Think" (Grok 4) on the results page for advanced AI reasoning.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, ultraThinkSuggestion])
        }
        
        setCurrentConfidence(result.current_confidence || 85)
        // Don't auto-complete - let user decide when they're done
        setAnalysisReady(true)
        
      } else if (result.message && result.message.includes('already achieved')) {
        // Target confidence already reached!
        const targetReachedMessage: Message = {
          id: `target-reached-${Date.now()}`,
          role: 'assistant',
          content: `🎯 Excellent! We've already reached ${result.current_confidence}% confidence. Let me generate your comprehensive report with this high-confidence diagnosis.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, targetReachedMessage])
        setAnalysisReady(true)
        setIsComplete(false)
        setCurrentConfidence(result.current_confidence || 90)
        
        // Show questions needed info if available
        if (result.questions_needed === 0) {
          const noQuestionsMessage: Message = {
            id: `no-questions-${Date.now()}`,
            role: 'assistant',
            content: `No additional questions needed - we have sufficient confidence for an accurate diagnosis.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, noQuestionsMessage])
        }
        
      } else {
        // Generic completion or already at target
        const completeMessage: Message = {
          id: `complete-${Date.now()}`,
          role: 'assistant',
          content: result.message || "Based on the information provided, I have sufficient data for a comprehensive analysis. Let me generate your report.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, completeMessage])
        setAnalysisReady(true)
        setIsComplete(false)
        setCurrentConfidence(result.current_confidence || 85)
      }
      
    } catch (error) {
      console.error('Ask Me More failed:', error)
      
      let errorType = 'general'
      let errorMessage = "I'm having trouble generating additional questions right now."
      
      if (error instanceof Error) {
        // Handle specific error types as per the guide
        if (error.message.includes('reached maximum')) {
          errorType = 'question_limit'
          errorMessage = 'Maximum questions reached. Please complete your analysis.'
        } else if (error.message.includes('not found') || error.message.includes('NoneType')) {
          errorType = 'session_not_found'
          errorMessage = 'Session expired or not found. Please complete the analysis or start a new Deep Dive.'
        } else if (error.message.includes('Session must be in analysis_ready')) {
          errorType = 'session_state'
          errorMessage = 'The session is not ready for additional questions. Please complete the initial analysis first.'
        }
      }
      
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
      
      // If session not found, provide alternatives
      if (errorType === 'session_not_found' || errorType === 'session_state') {
        const alternativesMessage: Message = {
          id: `alternatives-${Date.now()}`,
          role: 'assistant',
          content: `You have a few options:

1. **Complete Current Analysis** - Generate your report with ${currentConfidence || 85}% confidence
2. **Use Ultra Think** - Get enhanced analysis with advanced AI reasoning (available on results page)
3. **Start Fresh Deep Dive** - Begin a new session with your current insights`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, alternativesMessage])
      }
      
      // Allow completing the analysis with current confidence
      setAnalysisReady(true)
    } finally {
      setIsAskingMore(false)
    }
  }

  // Show results immediately when we have final analysis
  if (finalAnalysis && isComplete) {
    console.log('Showing Deep Dive results, finalAnalysis:', finalAnalysis)
    // Ensure we pass the correct data structure
    const resultsData = {
      ...finalAnalysis,
      scan_id: finalAnalysis.scan_id || finalAnalysis.deep_dive_id,
      mode: 'deep'
    }
    return <QuickScanResults scanData={resultsData} onNewScan={() => window.location.reload()} mode="deep" />
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
                  {(message.id.startsWith('diagnosis-') || message.content.includes('Based on your symptoms')) ? (
                    <div>
                      <p className="text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ 
                        __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') 
                      }} />
                      {/* Enhanced analysis options */}
                      <div className="space-y-3">
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          onClick={() => {
                            console.log('View Full Analysis button clicked')
                            setShowReport(true)
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <FileText className="w-5 h-5" />
                          View Full Analysis Report
                        </motion.button>

                        {/* Advanced analysis options */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3"
                        >
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              console.log('Think Harder button clicked in chat, finalAnalysis:', finalAnalysis)
                              handleThinkHarder()
                            }}
                            disabled={isThinkingHarder || isAskingMore}
                            className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 hover:from-purple-600/30 hover:to-pink-600/30 hover:text-purple-200 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                          >
                            {/* Animated background gradient */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"
                              animate={{
                                opacity: isThinkingHarder ? [0.1, 0.3, 0.1] : 0,
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                            
                            {isThinkingHarder ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="font-medium"
                                >
                                  Grokking your symptoms...
                                </motion.div>
                              </>
                            ) : (
                              <>
                                <Brain className="w-5 h-5 group-hover:animate-pulse transition-transform group-hover:scale-110" />
                                <span className="font-medium">Ultra Think</span>
                              </>
                            )}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAskMeMore()}
                            disabled={isThinkingHarder || isAskingMore}
                            className="relative px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 text-emerald-300 hover:from-emerald-600/30 hover:to-cyan-600/30 hover:text-emerald-200 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                          >
                            {/* Animated background gradient */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10"
                              animate={{
                                opacity: isAskingMore ? [0.1, 0.3, 0.1] : 0,
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                            
                            {isAskingMore ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="font-medium"
                                >
                                  Continuing Questions...
                                </motion.div>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-5 h-5 group-hover:animate-bounce transition-transform group-hover:scale-110" />
                                <span className="font-medium">Ask Me More</span>
                              </>
                            )}
                          </motion.button>
                        </motion.div>

                        {/* Subtle explanation */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="text-xs text-gray-400 text-center space-y-1"
                        >
                          <p><span className="text-purple-400">Ultra Think:</span> Grok 4's most advanced reasoning for complex cases</p>
                          <p><span className="text-emerald-400">Ask Me More:</span> Continue until 90%+ confidence</p>
                        </motion.div>
                      </div>
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
        {!isComplete && !analysisReady && currentQuestion && currentQuestion.trim() !== '' && (
          <form onSubmit={handleSubmit} className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
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
        
        {/* Complete button when analysis is ready */}
        {!isComplete && analysisReady && !isLoading && (
          <div className="p-4 border-t border-white/10">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-400 mb-2">
                I've gathered enough information to provide a comprehensive analysis.
              </p>
              <p className="text-xs text-gray-500">
                Current confidence: ~85% • Target: 90%+
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* Generate Analysis button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => completeDeepDive()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Generate Analysis Report
              </motion.button>
              
              {/* Ask Me More button - only show if under 11 total questions */}
              {questionCount < 11 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAskMeMore()}
                  disabled={isAskingMore}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 text-emerald-300 hover:from-emerald-600/30 hover:to-cyan-600/30 hover:text-emerald-200 hover:border-emerald-400/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAskingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                      Preparing Questions...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 inline-block mr-2" />
                      Ask Me More ({11 - questionCount} questions left)
                    </>
                  )}
                </motion.button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              {questionCount >= 11 
                ? "Maximum questions reached (11 total). Please complete your analysis."
                : "Choose \"Ask Me More\" for serious symptoms or when you need higher diagnostic certainty"
              }
            </p>
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
            <h4 className="text-sm font-medium text-indigo-400 mb-1">
              {isAskingMore ? 'Reaching Higher Confidence' : 'Why these questions?'}
            </h4>
            <p className="text-xs text-gray-400">
              {isAskingMore 
                ? `Asking targeted questions to increase diagnostic confidence from ${currentConfidence || 85}% to ${scanData.targetConfidence || 90}%.`
                : 'Each question is carefully selected based on your symptoms to help identify patterns, rule out serious conditions, and provide the most accurate health guidance.'}
            </p>
            
            {/* Confidence Progress Bar for Ask Me More */}
            {isAskingMore && currentConfidence && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Confidence Progress</span>
                  <span className="text-xs text-indigo-400 font-medium">{currentConfidence}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                    initial={{ width: '85%' }}
                    animate={{ width: `${currentConfidence}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Target marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                    style={{ left: `${scanData.targetConfidence || 90}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Start: 85%</span>
                  <span className="text-xs text-emerald-400">Target: {scanData.targetConfidence || 90}%</span>
                </div>
                {askMoreQuestionCount > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Additional questions asked: {askMoreQuestionCount} of 5 max
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}