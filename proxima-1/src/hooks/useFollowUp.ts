'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface FollowUpQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'text' | 'yes_no' | 'trigger_check'
  options?: string[]
  show_if?: string
  required?: boolean
  placeholder?: string
  category?: string
  rationale?: string
}

interface FollowUpContext {
  chain_id: string
  days_since_original: number
  days_since_last?: number
  follow_up_number: number
  has_active_tracking: boolean
  condition?: string
}

interface FollowUpResult {
  follow_up_id: string
  chain_id: string
  assessment: {
    condition: string
    confidence: number
    severity: string
    progression: string
  }
  assessment_evolution: {
    original_assessment: string
    current_assessment: string
    confidence_change: string
    diagnosis_refined: boolean
    key_discoveries: string[]
  }
  progression_narrative: {
    summary: string
    details: string
    milestone: string
  }
  pattern_insights: {
    discovered_patterns: string[]
    concerning_patterns: string[]
  }
  treatment_efficacy: {
    working: string[]
    not_working: string[]
    should_try: string[]
  }
  recommendations: {
    immediate: string[]
    this_week: string[]
    consider: string[]
    next_follow_up: string
  }
  confidence_indicator: {
    level: string
    explanation: string
    visual: string
  }
  medical_visit_explained?: string
}

// Removed MedicalVisit interface - now handled inline

export function useFollowUp(assessmentId: string, assessmentType: string) {
  const [loading, setLoading] = useState(true)
  const [baseQuestions, setBaseQuestions] = useState<FollowUpQuestion[]>([])
  const [aiQuestions, setAiQuestions] = useState<FollowUpQuestion[]>([])
  const [mergedQuestions, setMergedQuestions] = useState<FollowUpQuestion[]>([])
  const [context, setContext] = useState<FollowUpContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<FollowUpResult | null>(null)
  
  const router = useRouter()
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // Map frontend assessment types to backend expected types
  const mapAssessmentType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'general': 'general_assessment',
      'general_deep': 'general_deepdive',
      'quick_scan': 'quick_scan',
      'deep_dive': 'deep_dive'
    }
    return typeMap[type] || type
  }

  // Initialize follow-up and get questions
  const initializeFollowUp = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Map assessment type for backend
      const backendType = mapAssessmentType(assessmentType)

      // Call backend to get follow-up questions
      const response = await fetch(
        `${API_URL}/api/follow-up/questions/${assessmentId}?assessment_type=${backendType}&user_id=${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get follow-up questions')
      }

      const data = await response.json()
      
      console.log('Follow-up questions received from backend:', {
        base_questions: data.base_questions,
        ai_questions: data.ai_questions,
        context: data.context,
        raw_response: data
      })
      
      // Store questions and context
      setBaseQuestions(data.base_questions || [])
      setAiQuestions(data.ai_questions || [])
      setContext(data.context)
      
      // Merge questions in the correct order:
      // Q1, Q2, Q3, AI1, Q4, AI2, AI3, Q5
      const merged = mergeQuestions(data.base_questions, data.ai_questions)
      setMergedQuestions(merged)
      
      // Store chain_id for later use
      if (data.context?.chain_id) {
        localStorage.setItem(`followup_chain_${assessmentId}`, data.context.chain_id)
      }
      
    } catch (err) {
      console.error('Error initializing follow-up:', err)
      setError(err instanceof Error ? err.message : 'Failed to load follow-up')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, assessmentType, supabase, API_URL])
  
  // Merge questions in the specified order
  const mergeQuestions = (base: FollowUpQuestion[], ai: FollowUpQuestion[]): FollowUpQuestion[] => {
    if (!base || !ai) return [...(base || []), ...(ai || [])]
    
    // Order: Q1, Q2, Q3, AI1, Q4, AI2, AI3, Q5
    const merged: FollowUpQuestion[] = []
    
    // Add questions in specific order
    if (base[0]) merged.push(base[0]) // Q1: Changes since last?
    if (base[1]) merged.push(base[1]) // Q2: Specific changes (conditional)
    if (base[2]) merged.push(base[2]) // Q3: Severity change
    if (ai[0]) merged.push({ ...ai[0], category: 'ai' }) // AI1: Condition-specific
    if (base[3]) merged.push(base[3]) // Q4: New triggers
    if (ai[1]) merged.push({ ...ai[1], category: 'ai' }) // AI2: Treatment-specific
    if (ai[2]) merged.push({ ...ai[2], category: 'ai' }) // AI3: Progression-specific
    if (base[4]) merged.push(base[4]) // Q5: Saw doctor? (last)
    
    return merged
  }

  // Submit follow-up responses
  const submitFollowUp = async (responses: Record<string, any>) => {
    try {
      setSubmitting(true)
      setError(null)
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Map assessment type for backend
      const backendType = mapAssessmentType(assessmentType)

      // Provider type mapping from UI to backend format
      const providerTypeMap: Record<string, string> = {
        'Primary Care': 'primary',
        'Specialist': 'specialist',
        'Urgent Care': 'urgent_care',
        'Emergency': 'er',
        'Telehealth': 'telehealth'
      }

      // Clean responses - remove undefined/null values and ensure proper types
      const cleanedResponses: Record<string, any> = {}
      let medicalVisit = null
      
      for (const [key, value] of Object.entries(responses)) {
        if (value !== undefined && value !== null && value !== '') {
          // Don't include medical visit fields in main responses
          if (key.startsWith('q5_')) {
            continue
          }
          
          // Handle Q5 boolean conversion
          if (key === 'q5') {
            cleanedResponses[key] = value === 'Yes' ? true : false
            continue
          }
          
          // Handle trigger text field - convert from _triggers to _text
          if (key.endsWith('_triggers')) {
            const baseKey = key.replace('_triggers', '_text')
            cleanedResponses[baseKey] = value
            continue
          }
          
          // Handle AI questions - check if question was marked as AI
          const questionIndex = mergedQuestions.findIndex(q => q.id === key)
          if (questionIndex !== -1 && mergedQuestions[questionIndex].category === 'ai') {
            // Map AI question IDs to backend format
            const aiQuestionMap: Record<string, string> = {
              'ai1': 'ai_q1',
              'ai2': 'ai_q2', 
              'ai3': 'ai_q3'
            }
            const mappedKey = aiQuestionMap[key] || `ai_${key}`
            cleanedResponses[mappedKey] = value
            continue
          }
          
          // Convert numeric strings to numbers if needed
          if (typeof value === 'string' && !isNaN(Number(value)) && key.includes('scale')) {
            cleanedResponses[key] = Number(value)
          } else {
            cleanedResponses[key] = value
          }
        }
      }
      
      // Extract medical visit data if user saw a doctor
      if (responses.q5 === 'Yes') {
        const providerType = responses.q5_provider_type
        medicalVisit = {
          provider_type: providerTypeMap[providerType] || providerType?.toLowerCase() || '',
          provider_specialty: responses.q5_specialty || undefined,
          assessment: responses.q5_assessment || '',
          treatments: responses.q5_treatments || '',
          follow_up_timing: responses.q5_follow_up_timing || undefined
        }
        
        // Remove undefined fields
        Object.keys(medicalVisit).forEach(key => {
          if (medicalVisit[key] === undefined) {
            delete medicalVisit[key]
          }
        })
      }

      // Ensure we have at least some responses
      if (Object.keys(cleanedResponses).length === 0) {
        throw new Error('Please answer at least one question before submitting')
      }

      // Prepare submission data matching backend expectations
      const submissionData = {
        assessment_id: assessmentId,
        assessment_type: backendType,
        chain_id: context?.chain_id || localStorage.getItem(`followup_chain_${assessmentId}`) || null,
        responses: cleanedResponses,
        medical_visit: medicalVisit,
        user_id: user.id
      }

      console.log('Submitting follow-up data:', submissionData)
      
      // Submit to backend
      const response = await fetch(`${API_URL}/api/follow-up/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          sentData: submissionData
        })
        throw new Error(errorData.detail || `Failed to submit follow-up (${response.status})`)
      }

      const result = await response.json()
      console.log('Follow-up submission successful, result:', result)
      setResult(result)
      
      // Clear stored chain_id after successful submission
      localStorage.removeItem(`followup_chain_${assessmentId}`)
      
      return result
      
    } catch (err) {
      console.error('Error submitting follow-up:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit follow-up')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  // Get follow-up chain/timeline
  const getFollowUpChain = async () => {
    try {
      const chainId = context?.chain_id || localStorage.getItem(`followup_chain_${assessmentId}`)
      if (!chainId) return null
      
      const response = await fetch(
        `${API_URL}/api/follow-up/chain/${assessmentId}?include_events=true`
      )
      
      if (!response.ok) {
        throw new Error('Failed to get follow-up chain')
      }
      
      return await response.json()
      
    } catch (err) {
      console.error('Error getting chain:', err)
      return null
    }
  }

  // Check if follow-up is available (minimum 1 day)
  const canFollowUp = (minDays: number = 1) => {
    if (!context) return false
    return context.days_since_original >= minDays || context.days_since_last >= minDays
  }

  // Get days since assessment for display
  const getDaysSince = () => {
    if (!context) return 0
    return context.days_since_last || context.days_since_original
  }

  // Navigate to follow-up results
  const navigateToResults = (followUpId: string) => {
    router.push(`/follow-up/results/${followUpId}`)
  }
  
  // Navigate to follow-up form
  const navigateToFollowUp = () => {
    router.push(`/follow-up/${assessmentType}/${assessmentId}`)
  }

  // Initialize on mount
  useEffect(() => {
    if (assessmentId && assessmentType) {
      initializeFollowUp()
    }
  }, [assessmentId, assessmentType, initializeFollowUp])

  return {
    // State
    loading,
    baseQuestions,
    aiQuestions,
    mergedQuestions,
    context,
    error,
    submitting,
    result,
    
    // Actions
    submitFollowUp,
    getFollowUpChain,
    navigateToResults,
    navigateToFollowUp,
    
    // Helpers
    canFollowUp,
    getDaysSince,
    
    // Re-initialize if needed
    refresh: initializeFollowUp
  }
}

// Hook for displaying follow-up results
export function useFollowUpResult(followUpId: string) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<FollowUpResult | null>(null)
  const [chain, setChain] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true)
        
        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }
        
        // For now, get the result from localStorage if just submitted
        // In production, this would fetch from the backend
        const storedResult = localStorage.getItem(`followup_result_${followUpId}`)
        if (storedResult) {
          const parsed = JSON.parse(storedResult)
          setResult(parsed)
          
          // Also fetch the chain if we have assessment_id
          if (parsed.assessment_id) {
            const chainResponse = await fetch(
              `${API_URL}/api/follow-up/chain/${parsed.assessment_id}?include_events=false`
            )
            if (chainResponse.ok) {
              const chainData = await chainResponse.json()
              setChain(chainData)
            }
          }
        } else {
          // In production, fetch from backend
          throw new Error('Follow-up result not found')
        }
        
      } catch (err) {
        console.error('Error loading result:', err)
        setError(err instanceof Error ? err.message : 'Failed to load result')
      } finally {
        setLoading(false)
      }
    }
    
    if (followUpId) {
      fetchResult()
    }
  }, [followUpId, API_URL, supabase])
  
  return {
    loading,
    result,
    chain,
    error
  }
}