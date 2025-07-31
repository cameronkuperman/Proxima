// AI Predictions API Types

export interface AIAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timeframe: string;
  confidence: number;
  preventionTip?: string;
  actionUrl: string;
  generated_at?: string;
}

export interface DashboardAlertResponse {
  alert: AIAlert | null;
  status: 'success' | 'cached' | 'insufficient_data' | 'no_patterns' | 'error';
  reason?: string;
  data_quality?: number;
  expires_at?: string;
}

export interface ImmediatePrediction {
  id: string;
  type: 'immediate';
  title: string;
  subtitle?: string;
  pattern: string;
  trigger_combo?: string;
  historical_accuracy?: string;
  confidence: number;
  gradient?: string;
  prevention_protocol: string[];
  // Legacy fields for backwards compatibility
  severity?: 'info' | 'warning' | 'alert';
  description?: string;
  preventionProtocols?: string[];
  category?: string;
  reasoning?: string;
  dataPoints?: string[];
  generated_at?: string;
}

export interface SeasonalPrediction {
  id: string;
  type: 'seasonal';
  title: string;
  subtitle?: string;
  pattern: string;
  timeframe?: string;
  confidence: number;
  gradient?: string;
  prevention_protocol: string[];
  historical_context?: string;
  generated_at?: string;
}

export interface LongtermAssessment {
  id: string;
  condition: string;
  current_status: string;
  risk_factors: string[];
  trajectory: {
    current_path: {
      description: string;
      risk_level: 'low' | 'moderate' | 'high';
      projected_outcome: string;
    };
    optimized_path: {
      description: string;
      risk_level: 'low' | 'moderate' | 'high';
      requirements: string[];
    };
  };
  prevention_strategy: string[];
  confidence: number;
  data_basis: string;
  generated_at?: string;
}

export interface BodyPatterns {
  tendencies: string[];
  positive_responses: string[];
  // Legacy field
  positiveResponses?: string[];
  pattern_metadata?: {
    total_patterns_analyzed: number;
    confidence_level: 'low' | 'medium' | 'high';
    data_span_days: number;
    generated_at?: string;
  };
}

export interface PatternQuestion {
  id: string;
  question: string;
  category: 'mood' | 'sleep' | 'energy' | 'physical';
  icon?: 'brain' | 'moon' | 'battery' | 'heart';
  brief_answer: string;
  deep_dive: {
    detailed_insights: string[];
    connected_patterns: string[];
    actionable_advice: string[];
  };
  relevance_score: number;
  based_on: string[];
  // Legacy fields
  answer?: string;
  deepDive?: string[];
  connections?: string[];
  relevanceScore?: number;
  basedOn?: string[];
}

export interface PredictionsResponse<T> {
  predictions: T[];
  data_quality_score?: number;
  status: 'success' | 'cached' | 'insufficient_data' | 'fallback' | 'parse_error' | 'error';
  generated_at?: string;
  expires_at?: string;
  message?: string;
}

export interface SeasonalPredictionsResponse extends PredictionsResponse<SeasonalPrediction> {
  current_season?: string;
  next_season_transition?: string;
}

export interface LongtermPredictionsResponse {
  assessments: LongtermAssessment[];
  overall_health_trajectory?: 'positive' | 'stable_with_improvement_potential' | 'needs_attention';
  key_focus_areas?: string[];
  status: 'success' | 'cached' | 'insufficient_data' | 'error';
  expires_at?: string;
}

export interface BodyPatternsResponse extends BodyPatterns {
  status: 'success' | 'cached' | 'insufficient_data' | 'error';
  expires_at?: string;
}

export interface PatternQuestionsResponse {
  questions: PatternQuestion[];
  total_questions: number;
  categories_covered: string[];
  status: 'success' | 'cached' | 'insufficient_data' | 'error';
  expires_at?: string;
}

// Weekly bundle type (for backwards compatibility)
export interface WeeklyPredictions {
  id: string;
  dashboard_alert: AIAlert;
  predictions: (ImmediatePrediction | SeasonalPrediction)[];
  pattern_questions: PatternQuestion[];
  body_patterns: BodyPatterns;
  generated_at: string;
  data_quality_score: number;
  is_current?: boolean;
  viewed_at?: string;
  generation_status?: string;
}