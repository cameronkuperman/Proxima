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
  | 'pulmonology'
  | 'primary-care';

export interface SymptomTimelineEntry {
  date: string;
  symptoms: string;
  severity: number;
  context: string;
  duration: string;
  resolution?: string;
}

export interface PatternAnalysis {
  frequency: string;
  triggers: string[];
  alleviating_factors: string[];
  progression: string;
}

export interface DiagnosticTest {
  test: string;
  rationale: string;
  timing: string;
}

export interface ContingentTest extends DiagnosticTest {
  condition: string;
}

export interface Medication {
  medication: string;
  rationale: string;
  instructions?: string;
  monitoring?: string;
}

export interface ClinicalScale {
  score?: number;
  calculated?: number;
  grade?: string;
  interpretation?: string;
  breakdown?: Record<string, any>;
}

export interface EnhancedReportData {
  // Core summary sections
  executive_summary?: {
    one_page_summary: string;
    key_findings?: string[];
    patterns_identified?: string[];
    chief_complaints?: string[];
    action_items?: string[];
    specialist_focus?: string;
    target_audience?: string;
  };
  
  // Clinical summary with timeline
  clinical_summary?: {
    chief_complaint: string;
    hpi: string;
    symptom_timeline: SymptomTimelineEntry[];
    pattern_analysis: PatternAnalysis;
    presenting_complaints?: string;
    relevant_history?: string;
    examination_priorities?: string[];
  };
  
  // Pattern analysis
  pattern_analysis?: {
    correlation_patterns?: {
      symptom_triggers?: string[];
    };
  };
  
  // Diagnostic priorities
  diagnostic_priorities?: {
    immediate: DiagnosticTest[];
    short_term: DiagnosticTest[];
    contingent: ContingentTest[];
  };
  
  // Treatment recommendations
  treatment_recommendations?: {
    immediate_medical_therapy?: Medication[];
    lifestyle_interventions?: Record<string, string>;
    preventive_measures?: string[];
  };
  
  // Follow-up plan
  follow_up_plan?: {
    timing: string;
    monitoring_parameters: string[];
    red_flags: string[];
    next_steps: string[];
  };
  
  // Legacy recommendations structure
  recommendations?: {
    immediate_actions?: string[];
    lifestyle_modifications?: string[];
    monitoring_priorities?: string[];
  };
  
  // Billing optimization
  billing_optimization?: {
    suggested_codes?: {
      icd10?: string[];
      cpt?: string[];
    };
    documentation_requirements?: string[];
  };
  
  // Data quality notes
  data_quality_notes?: {
    completeness: string;
    consistency: string;
    gaps: string[];
  };
  
  // Specialist-specific enhanced fields
  cardiology_assessment?: {
    functional_capacity: {
      current: number;
      baseline: number;
      units: string;
    };
    nyha_class: string;
    risk_factors: string[];
    clinical_scales: {
      chad2ds2_vasc?: ClinicalScale;
      has_bled?: ClinicalScale;
    };
  };
  
  cardiology_specific_findings?: {
    cardiac_symptoms: Record<string, string>;
    examination_findings: Record<string, string>;
    ecg_interpretation?: string;
    imaging_recommendations: string[];
  };
  
  neurology_assessment?: {
    headache_pattern?: {
      type: string;
      frequency: string;
      duration: string;
      characteristics: string[];
    };
    neurological_deficits?: string[];
    clinical_scales: {
      midas_score?: ClinicalScale;
      hit6?: ClinicalScale;
    };
  };
  
  neurology_specific_findings?: {
    red_flags?: string[];
    neurological_exam?: Record<string, string>;
    differential_considerations: string[];
  };
  
  psychiatry_assessment?: {
    mood_symptoms?: Record<string, string>;
    anxiety_symptoms?: Record<string, string>;
    psychotic_symptoms?: Record<string, string>;
    functional_impact: string;
    clinical_scales: {
      phq9?: ClinicalScale;
      gad7?: ClinicalScale;
    };
  };
  
  psychiatry_specific_findings?: {
    mental_status_exam?: Record<string, string>;
    risk_assessment?: {
      suicide_risk: string;
      violence_risk: string;
      protective_factors: string[];
    };
    substance_use_assessment?: Record<string, string>;
  };
  
  dermatology_assessment?: {
    lesion_characteristics?: Record<string, string>;
    distribution_pattern?: string;
    associated_symptoms?: string[];
    progression?: string;
  };
  
  dermatology_specific_findings?: {
    lesion_description?: Record<string, string>;
    dermoscopy_findings?: string;
    differential_diagnosis: string[];
    biopsy_recommendation?: string;
  };
  
  gastroenterology_assessment?: {
    symptom_pattern?: Record<string, string>;
    dietary_triggers?: string[];
    bowel_patterns?: Record<string, string>;
    alarm_features?: string[];
  };
  
  gastroenterology_specific_findings?: {
    abdominal_exam?: Record<string, string>;
    endoscopy_indications?: string[];
    nutritional_assessment?: Record<string, string>;
  };
  
  endocrinology_assessment?: {
    metabolic_symptoms?: Record<string, string>;
    hormonal_symptoms?: Record<string, string>;
    glycemic_control?: Record<string, string>;
  };
  
  endocrinology_specific_findings?: {
    physical_findings?: Record<string, string>;
    laboratory_priorities?: string[];
    screening_recommendations?: string[];
  };
  
  pulmonology_assessment?: {
    respiratory_symptoms?: Record<string, string>;
    exercise_capacity?: string;
    environmental_exposures?: string[];
    smoking_history?: Record<string, string>;
  };
  
  pulmonology_specific_findings?: {
    lung_exam?: Record<string, string>;
    pulmonary_function_indications?: string[];
    imaging_findings?: string;
  };
  
  // Primary care is similar to general but can have its own specifics
  primary_care_assessment?: {
    preventive_care_gaps?: string[];
    chronic_disease_management?: Record<string, string>;
    health_maintenance?: string[];
  };
  
  primary_care_specific_findings?: {
    vital_signs?: Record<string, string>;
    review_of_systems?: Record<string, string>;
    screening_due?: string[];
  };
  
  // Legacy specialist fields for backwards compatibility
  cardiology_specific?: {
    risk_stratification?: {
      ascvd_risk?: string;
      heart_failure_risk?: string;
      arrhythmia_risk?: string;
    };
    recommended_tests?: {
      immediate?: string[];
      follow_up?: string[];
    };
    ecg_interpretation?: string;
    hemodynamic_assessment?: Record<string, string>;
  };
  neurology_specific?: any;
  psychiatry_specific?: any;
  dermatology_specific?: any;
  gastroenterology_specific?: any;
  endocrinology_specific?: any;
  pulmonology_specific?: any;
}

// Update ReportData to use EnhancedReportData
export type ReportData = EnhancedReportData;