import { QuickScanFormData } from './quickscan-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'https://web-production-945c4.up.railway.app'

export interface DeepDiveStartRequest {
  body_part: string
  form_data: QuickScanFormData
  user_id?: string
  model?: string
}

export interface DeepDiveStartResponse {
  session_id: string
  question: string
  question_number: 1
  estimated_questions: "2-3"
  question_type: "differential" | "safety" | "severity" | "timeline"
  status: "success" | "error"
}

export interface DeepDiveContinueRequest {
  session_id: string
  answer: string
  question_number: number
}

export interface DeepDiveContinueResponse {
  question?: string
  question_number?: number
  is_final_question?: boolean
  confidence_projection?: string
  ready_for_analysis?: boolean
  questions_completed?: number
  status: "success" | "error"
}

export interface DeepDiveCompleteRequest {
  session_id: string
  final_answer?: string
}

export interface DeepDiveCompleteResponse {
  deep_dive_id: string
  analysis: any // Same format as Quick Scan
  body_part: string
  confidence: number
  questions_asked: number
  reasoning_snippets: string[]
  usage: {
    total_tokens: number
    prompt_tokens: number
    completion_tokens: number
  }
  status: "success" | "error"
}

export const deepDiveClient = {
  async startDeepDive(
    bodyPart: string,
    formData: QuickScanFormData,
    userId?: string,
    model?: string
  ): Promise<DeepDiveStartResponse> {
    console.log('Deep Dive Start Request:', {
      body_part: bodyPart,
      form_data: formData,
      user_id: userId,
      model: model || 'deepseek/deepseek-r1-distill-llama-70b:free'
    })
    
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body_part: bodyPart,
        form_data: {
          ...formData,
          painLevel: formData.painLevel ? parseInt(formData.painLevel) : undefined
        },
        user_id: userId,
        model: model || 'deepseek/deepseek-r1-0528:free'
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to start deep dive' }))
      throw new Error(error.error || 'Failed to start deep dive')
    }
    
    const result = await response.json()
    console.log('Deep Dive Start Raw Response:', JSON.stringify(result, null, 2))
    
    // Check if it's an error response
    if (result.error || result.status === 'error') {
      throw new Error(result.error || 'Deep dive failed')
    }
    
    // Validate response has required fields
    if (!result.session_id) {
      console.error('Invalid response structure:', result)
      throw new Error('Invalid response: Missing session_id')
    }
    
    return result
  },

  async continueDeepDive(
    sessionId: string,
    answer: string,
    questionNumber: number
  ): Promise<DeepDiveContinueResponse> {
    const requestBody = {
      session_id: sessionId,
      answer: answer,
      question_number: questionNumber,
    }
    
    console.log('Deep Dive Continue Request:', requestBody)
    
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to continue deep dive' }))
      throw new Error(error.error || 'Failed to continue deep dive')
    }
    
    const result = await response.json()
    console.log('Deep Dive Continue Raw Response:', JSON.stringify(result, null, 2))
    
    // Check if it's an error response
    if (result.error || result.status === 'error') {
      throw new Error(result.error || 'Deep dive continue failed')
    }
    
    return result
  },

  async completeDeepDive(
    sessionId: string,
    finalAnswer?: string
  ): Promise<DeepDiveCompleteResponse> {
    const requestBody = {
      session_id: sessionId,
      final_answer: finalAnswer,
    }
    
    console.log('Deep Dive Complete Request:', requestBody)
    
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to complete deep dive' }))
      throw new Error(error.error || 'Failed to complete deep dive')
    }
    
    const result = await response.json()
    console.log('Deep Dive Complete Raw Response:', JSON.stringify(result, null, 2))
    
    // Check if it's an error response
    if (result.error || result.status === 'error') {
      throw new Error(result.error || 'Deep dive complete failed')
    }
    
    return result
  },

  async generateSummary(deepDiveId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate_summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: deepDiveId,
          user_id: userId,
        }),
      })

      if (!response.ok) {
        console.warn('Failed to generate deep dive summary')
      }
    } catch (error) {
      console.warn('Summary generation failed:', error)
    }
  },

  async thinkHarder(
    sessionId: string,
    currentAnalysis: any,
    userId?: string,
    model: string = 'o4-mini'
  ): Promise<any> {
    console.log('Think Harder Request:', {
      session_id: sessionId,
      model,
      user_id: userId
    })
    
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/think-harder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        current_analysis: currentAnalysis,
        model,
        user_id: userId
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to think harder' }))
      throw new Error(error.error || 'Failed to get enhanced analysis')
    }
    
    const result = await response.json()
    console.log('Think Harder Response:', JSON.stringify(result, null, 2))
    
    return result
  },

  async askMeMore(
    sessionId: string,
    currentConfidence: number,
    targetConfidence: number = 90,
    userId?: string
  ): Promise<any> {
    console.log('Ask Me More Request:', {
      session_id: sessionId,
      current_confidence: currentConfidence,
      target_confidence: targetConfidence,
      user_id: userId
    })
    
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/ask-more`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        current_confidence: currentConfidence,
        target_confidence: targetConfidence,
        user_id: userId
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get additional questions' }))
      throw new Error(error.error || 'Failed to get additional questions')
    }
    
    const result = await response.json()
    console.log('Ask Me More Response:', JSON.stringify(result, null, 2))
    
    return result
  }
}