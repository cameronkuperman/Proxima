'use client'

import { useState, useCallback } from 'react'
import { generalAssessmentClient, AssessmentRefinementResponse } from '@/lib/general-assessment-client'
import { useAuth } from '@/contexts/AuthContext'

interface UseRefinementProps {
  assessmentId: string
  questions: string[]
  originalConfidence: number
  onComplete?: (result: AssessmentRefinementResponse) => void
}

export function useRefinement({
  assessmentId,
  questions,
  originalConfidence,
  onComplete
}: UseRefinementProps) {
  const { user } = useAuth()
  const [isRefining, setIsRefining] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string>>(new Map())
  const [refinedResult, setRefinedResult] = useState<AssessmentRefinementResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confidenceProgress, setConfidenceProgress] = useState(originalConfidence)

  const handleAnswer = useCallback((questionIndex: number, answer: string) => {
    const question = questions[questionIndex]
    setAnswers(prev => {
      const newAnswers = new Map(prev)
      newAnswers.set(question, answer)
      return newAnswers
    })

    // Simulate confidence increase as questions are answered
    const answeredCount = answers.size + 1
    const progressPercentage = answeredCount / questions.length
    const estimatedConfidenceBoost = progressPercentage * 22.5 // Average 22.5% boost
    setConfidenceProgress(Math.min(originalConfidence + estimatedConfidenceBoost, 100))

    // Move to next question or submit if last
    if (questionIndex < questions.length - 1) {
      setCurrentQuestionIndex(questionIndex + 1)
    } else {
      // All questions answered, submit refinement
      submitRefinement([...answers.entries(), [question, answer]])
    }
  }, [assessmentId, questions, answers, originalConfidence])

  const submitRefinement = async (allAnswers: [string, string][]) => {
    setIsRefining(true)
    setError(null)

    try {
      const formattedAnswers = allAnswers.map(([question, answer]) => ({
        question,
        answer
      }))

      const result = await generalAssessmentClient.refineAssessment(
        assessmentId,
        formattedAnswers,
        user?.id
      )

      setRefinedResult(result)
      setConfidenceProgress(result.refined_confidence)
      
      if (onComplete) {
        onComplete(result)
      }
    } catch (err) {
      console.error('Refinement error:', err)
      setError(err instanceof Error ? err.message : 'Failed to refine assessment')
      // Reset to previous question on error
      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex))
    } finally {
      setIsRefining(false)
    }
  }

  const resetRefinement = useCallback(() => {
    setCurrentQuestionIndex(0)
    setAnswers(new Map())
    setRefinedResult(null)
    setError(null)
    setConfidenceProgress(originalConfidence)
  }, [originalConfidence])

  const skipQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }, [currentQuestionIndex, questions.length])

  return {
    // State
    currentQuestionIndex,
    answers,
    refinedResult,
    isRefining,
    error,
    confidenceProgress,
    
    // Actions
    handleAnswer,
    resetRefinement,
    skipQuestion,
    
    // Computed
    isComplete: refinedResult !== null,
    progress: answers.size / questions.length,
    confidenceImprovement: confidenceProgress - originalConfidence
  }
}