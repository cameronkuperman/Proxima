export interface ReportAnalysisRequest {
  user_id?: string;
  context: {
    purpose?: 'symptom_specific' | 'annual_checkup' | 'specialist_referral' | 'emergency';
    symptom_focus?: string;
    time_frame?: { start: string; end: string };
    target_audience?: 'self' | 'primary_care' | 'specialist' | 'emergency';
  };
  available_data?: {
    quick_scan_ids?: string[];
    deep_dive_ids?: string[];
    photo_session_ids?: string[];
  };
}

export interface SpecialistReportRequest {
  analysis_id: string;
  user_id?: string;
  specialty?: string;
}

export interface TimePeriodReportRequest {
  user_id: string;
  include_wearables?: boolean;
}

export interface MedicalReport {
  report_id: string;
  report_type: string;
  generated_at: string;
  report_data: any;
  confidence_score?: number;
  status: 'success' | 'error';
}

export interface ReportAnalysisResponse {
  recommended_endpoint: string;
  recommended_type: string;
  reasoning: string;
  confidence: number;
  report_config: any;
  analysis_id: string;
  status: 'success' | 'error';
}

export type SpecialtyType = 
  | 'cardiology' 
  | 'neurology' 
  | 'psychiatry' 
  | 'dermatology' 
  | 'gastroenterology' 
  | 'endocrinology' 
  | 'pulmonology';

export interface ReportData {
  executive_summary?: {
    one_page_summary: string;
    key_findings?: string[];
    patterns_identified?: string[];
    chief_complaints?: string[];
    action_items?: string[];
  };
  pattern_analysis?: {
    correlation_patterns?: {
      symptom_triggers?: string[];
    };
  };
  recommendations?: {
    immediate_actions?: string[];
    lifestyle_modifications?: string[];
    monitoring_priorities?: string[];
  };
  billing_optimization?: {
    suggested_codes?: {
      icd10?: string[];
      cpt?: string[];
    };
  };
  // Specialist-specific fields
  cardiology_specific?: {
    risk_stratification?: {
      ascvd_risk?: string;
      heart_failure_risk?: string;
    };
    recommended_tests?: {
      immediate?: string[];
      follow_up?: string[];
    };
  };
  neurology_specific?: any;
  psychiatry_specific?: any;
  dermatology_specific?: any;
  gastroenterology_specific?: any;
  endocrinology_specific?: any;
  pulmonology_specific?: any;
}