// General Assessment API clients

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

// Flash Assessment
export interface FlashAssessmentRequest {
  user_query: string;
  user_id?: string;
}

export interface FlashAssessmentResponse {
  flash_id: string;
  response: string;
  main_concern: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  confidence: number;
  next_steps: {
    recommended_action: 'general-assessment' | 'body-scan' | 'see-doctor' | 'monitor';
    reason: string;
  };
}

// General Assessment
export interface GeneralAssessmentRequest {
  category: 'energy' | 'mental' | 'sick' | 'medication' | 'multiple' | 'unsure';
  form_data: {
    symptoms: string;
    duration: string;
    impactLevel: number;
    [key: string]: any;
  };
  user_id?: string;
}

export interface GeneralAssessmentResponse {
  assessment_id: string;
  analysis: {
    primary_assessment: string;
    confidence: number;
    key_findings: string[];
    possible_causes: Array<{
      condition: string;
      likelihood: number;
      explanation: string;
    }>;
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high';
    follow_up_questions?: string[];
  };
}

// General Deep Dive
export interface GeneralDeepDiveStartRequest {
  category: string;
  form_data: any;
  user_id?: string;
}

export interface GeneralDeepDiveStartResponse {
  session_id: string;
  question: string;
  question_number: 1;
  estimated_questions: string;
  question_type: string;
  status: 'success' | 'error';
}

export interface GeneralDeepDiveContinueRequest {
  session_id: string;
  answer: string;
  question_number: number;
}

export interface GeneralDeepDiveContinueResponse {
  question?: string;
  question_number?: number;
  is_final_question?: boolean;
  ready_for_analysis?: boolean;
  status: 'success' | 'error';
}

export interface GeneralDeepDiveCompleteResponse {
  deep_dive_id: string;
  analysis: any;
  category: string;
  confidence: number;
  questions_asked: number;
  session_duration_ms: number;
  reasoning_snippets: string[];
  status: 'success' | 'error';
}

export class GeneralAssessmentClient {
  // Flash Assessment
  async performFlashAssessment(
    userQuery: string,
    userId?: string
  ): Promise<FlashAssessmentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/flash-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_query: userQuery,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Flash assessment failed' }));
      throw new Error(error.error || 'Flash assessment failed');
    }

    return await response.json();
  }

  // General Assessment
  async performGeneralAssessment(
    category: string,
    formData: any,
    userId?: string
  ): Promise<GeneralAssessmentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/general-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        form_data: formData,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'General assessment failed' }));
      throw new Error(error.error || 'General assessment failed');
    }

    return await response.json();
  }

  // General Deep Dive
  async startGeneralDeepDive(
    category: string,
    formData: any,
    userId?: string
  ): Promise<GeneralDeepDiveStartResponse> {
    const response = await fetch(`${API_BASE_URL}/api/general-deepdive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        form_data: formData,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to start deep dive' }));
      throw new Error(error.error || 'Failed to start deep dive');
    }

    return await response.json();
  }

  async continueGeneralDeepDive(
    sessionId: string,
    answer: string,
    questionNumber: number
  ): Promise<GeneralDeepDiveContinueResponse> {
    const response = await fetch(`${API_BASE_URL}/api/general-deepdive/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        answer,
        question_number: questionNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to continue deep dive' }));
      throw new Error(error.error || 'Failed to continue deep dive');
    }

    return await response.json();
  }

  async completeGeneralDeepDive(
    sessionId: string,
    finalAnswer?: string
  ): Promise<GeneralDeepDiveCompleteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/general-deepdive/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        final_answer: finalAnswer,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to complete deep dive' }));
      throw new Error(error.error || 'Failed to complete deep dive');
    }

    return await response.json();
  }
}

export const generalAssessmentClient = new GeneralAssessmentClient();