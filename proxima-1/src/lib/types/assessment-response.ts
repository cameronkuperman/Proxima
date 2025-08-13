// Assessment Response Types based on Backend API Structure
// Updated: 2025-01-13

export interface QuickScanResponse {
  scan_id: string;
  analysis: {
    confidence: number;
    primaryCondition: string;
    likelihood: string;
    symptoms: string[];
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high';
    differentials: Array<{
      condition: string;
      probability: number;
    }>;
    redFlags: string[];
    selfCare: string[];
    timeline: string;
    followUp: string;
    relatedSymptoms: string[];
  };
  // New fields
  what_this_means?: string;
  immediate_actions?: string[];
  body_part: string;
  confidence: number;
  user_id: string;
  usage: any;
  model: string;
  status: string;
}

export interface DeepDiveResponse {
  deep_dive_id: string;
  analysis: {
    confidence: number;
    primaryCondition: string;
    likelihood: string;
    symptoms: string[];
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high';
    differentials: Array<{
      condition: string;
      probability: number;
    }>;
    redFlags: string[];
    selfCare: string[];
    timeline: string;
    followUp: string;
    relatedSymptoms: string[];
    reasoning_snippets: string[];
  };
  // New fields
  what_this_means?: string;
  immediate_actions?: string[];
  body_part: string;
  confidence: number;
  questions_asked: number;
  reasoning_snippets: string[];
  usage: any;
  status: string;
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
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    follow_up_questions?: string[];
  };
  // New fields
  severity_level?: 'low' | 'moderate' | 'high' | 'urgent';
  confidence_level?: 'low' | 'medium' | 'high';
  what_this_means?: string;
  immediate_actions?: string[];
  red_flags?: string[];
  tracking_metrics?: string[];
  follow_up_timeline?: {
    check_progress: string;
    see_doctor_if: string;
  };
}

export interface GeneralDeepDiveResponse extends GeneralAssessmentResponse {
  deep_dive_id: string;
  questions_asked: number;
  reasoning_snippets?: string[];
}

export interface FlashAssessmentResponse {
  flash_id: string;
  response: string;
  main_concern: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  next_steps: {
    recommended_action: string;
    reason: string;
  };
}