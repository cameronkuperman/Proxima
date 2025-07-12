import { QuickScanFormData } from './quickscan-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:8000'

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
        model: model || 'deepseek/deepseek-r1-distill-llama-70b:free'
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to start deep dive' }))
      throw new Error(error.error || 'Failed to start deep dive')
    }
    
    return response.json()
  },

  async continueDeepDive(
    sessionId: string,
    answer: string,
    questionNumber: number
  ): Promise<DeepDiveContinueResponse> {
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        answer: answer,
        question_number: questionNumber,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to continue deep dive' }))
      throw new Error(error.error || 'Failed to continue deep dive')
    }
    
    return response.json()
  },

  async completeDeepDive(
    sessionId: string,
    finalAnswer?: string
  ): Promise<DeepDiveCompleteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/deep-dive/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        final_answer: finalAnswer,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to complete deep dive' }))
      throw new Error(error.error || 'Failed to complete deep dive')
    }
    
    return response.json()
  },

  async generateSummary(deepDiveId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deep-dive/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deep_dive_id: deepDiveId,
          user_id: userId,
        }),
      })

      if (!response.ok) {
        console.warn('Failed to generate deep dive summary')
      }
    } catch (error) {
      console.warn('Summary generation failed:', error)
    }
  }
}