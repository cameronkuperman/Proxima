export type PhotoCategory = 
  | 'medical_normal'
  | 'medical_sensitive'
  | 'medical_gore'
  | 'unclear'
  | 'non_medical'
  | 'inappropriate';

export interface PhotoUpload {
  id: string;
  category: PhotoCategory;
  stored: boolean;
  preview_url?: string;
}

export interface PhotoSession {
  id?: string;
  session_id?: string; // Backend returns this instead of id
  condition_name: string;
  description?: string;
  created_at: string;
  last_photo_at?: string;
  photo_count?: number;
  analysis_count?: number;
  is_sensitive?: boolean;
  latest_summary?: string;
  thumbnail_url?: string;
}

export interface AnalysisResult {
  analysis_id: string;
  analysis: {
    primary_assessment: string;
    confidence: number;
    visual_observations: string[];
    differential_diagnosis: string[];
    recommendations: string[];
    red_flags: string[];
    trackable_metrics?: TrackableMetric[];
  };
  comparison?: {
    days_between: number;
    changes: {
      size?: { from: number; to: number; unit: string; change: number };
      color?: { description: string };
      texture?: { description: string };
    };
    trend: 'improving' | 'worsening' | 'stable';
    ai_summary: string;
  };
  expires_at?: string;
}

export interface TrackableMetric {
  metric_name: string;
  current_value: number;
  unit: string;
  suggested_tracking: 'daily' | 'weekly' | 'monthly';
}

export interface UploadResponse {
  session_id: string;
  uploaded_photos: PhotoUpload[];
  requires_action?: {
    type: 'sensitive_modal' | 'unclear_modal';
    affected_photos: string[];
    message: string;
  };
}

export interface SessionExport {
  export_url: string;
  format: 'pdf' | 'json';
  includes_photos: boolean;
}

export interface ReminderConfig {
  reminder_id?: string;
  session_id: string;
  analysis_id: string;
  enabled: boolean;
  interval_days: number;
  reminder_method: 'email' | 'sms' | 'in_app' | 'none';
  reminder_text?: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  next_reminder_date?: string;
  status?: 'active' | 'paused' | 'completed';
  ai_reasoning?: string;
}

export interface FollowUpSuggestion {
  benefits_from_tracking: boolean;
  suggested_interval_days: number;
  reasoning: string;
  priority: 'routine' | 'important' | 'urgent';
}

export interface FollowUpUploadResponse {
  uploaded_photos: PhotoUpload[];
  comparison_results?: {
    compared_with: string[];
    days_since_last: number;
    analysis: {
      trend: 'stable' | 'improving' | 'worsening' | 'unknown';
      changes: any;
      confidence: number;
      summary: string;
    };
    visual_comparison?: VisualComparison;
    key_measurements?: KeyMeasurements;
  };
  follow_up_suggestion?: FollowUpSuggestion & {
    progression_summary?: ProgressionSummary;
    adaptive_scheduling?: AdaptiveScheduling;
  };
  smart_batching_info?: SmartBatchingInfo;
}

export interface MonitoringSuggestion {
  monitoring_plan: {
    recommended_interval_days: number;
    interval_type: 'fixed' | 'decreasing' | 'conditional';
    reasoning: string;
    schedule: {
      check_number: number;
      days_from_now: number;
      purpose: string;
    }[];
    red_flags_to_watch: string[];
    when_to_see_doctor: string;
  };
  confidence: number;
  based_on_conditions: string[];
}

export interface TimelineEvent {
  date: string;
  type: 'photo_upload' | 'follow_up' | 'scheduled_reminder';
  photos?: PhotoUpload[];
  analysis_summary?: string;
  comparison?: {
    days_since_previous: number;
    trend: 'stable' | 'improving' | 'worsening';
    summary: string;
  };
  status?: 'completed' | 'upcoming';
  message?: string;
}

export interface SessionTimeline {
  session: PhotoSession;
  timeline_events: TimelineEvent[];
  next_action?: {
    type: 'photo_follow_up' | 'review_results';
    date: string;
    days_until: number;
  };
  overall_trend?: {
    direction: 'stable' | 'improving' | 'worsening';
    total_duration_days: number;
    number_of_checks: number;
  };
}

// Enhanced follow-up interfaces
export interface VisualComparison {
  primary_change: string;
  change_significance: 'minor' | 'moderate' | 'significant' | 'critical';
  visual_changes: {
    size: {
      description: string;
      estimated_change_percent: number;
      clinical_relevance: string;
    };
    color: {
      description: string;
      areas_affected: string[];
      concerning: boolean;
    };
    shape: {
      description: string;
      symmetry_change: string;
      border_changes: string[];
    };
    texture: {
      description: string;
      new_features: string[];
    };
  };
  progression_analysis: {
    overall_trend: string;
    confidence_in_trend: number;
    rate_of_change: 'rapid' | 'moderate' | 'slow' | 'stable';
    key_finding: string;
  };
  clinical_interpretation: string;
  next_monitoring: {
    focus_areas: string[];
    red_flags_to_watch: string[];
    optimal_interval_days: number;
  };
}

export interface KeyMeasurements {
  latest: {
    size_estimate_mm: number;
    size_reference: string;
    primary_color: string;
    secondary_colors: string[];
    texture_description: string;
    symmetry_observation: string;
    elevation_observation: string;
  };
  condition_insights: {
    most_important_features: string[];
    progression_indicators: {
      improvement_signs: string[];
      worsening_signs: string[];
      stability_signs: string[];
    };
    optimal_photo_angle: string;
    optimal_lighting: string;
  };
}

export interface SmartBatchingInfo {
  total_photos: number;
  photos_shown: number;
  selection_reasoning: string[];
  omitted_periods: Array<{
    start: string;
    end: string;
    photos_omitted: number;
  }>;
}

export interface ProgressionSummary {
  trend: string;
  rate_of_change: string;
  total_analyses: number;
  red_flags_total: number;
  confidence_trend: number[];
  phase: 'initial' | 'active_monitoring' | 'maintenance' | 'ongoing';
  key_factors: string[];
}

export interface AdaptiveScheduling {
  current_phase: string;
  next_interval: number;
  adjust_based_on: string[];
}

export interface ProgressionAnalysisResponse {
  progression_metrics: {
    velocity: {
      overall_trend: 'growing' | 'shrinking' | 'stable';
      size_change_rate: string;
      acceleration: 'increasing' | 'decreasing' | 'stable';
      projected_size_30d: string;
      monitoring_phase: string;
    };
    risk_indicators: {
      rapid_growth: boolean;
      color_darkening: boolean;
      border_irregularity_increase: boolean;
      new_colors_appearing: boolean;
      asymmetry_increasing: boolean;
      overall_risk_level: 'low' | 'moderate' | 'high';
    };
    clinical_thresholds: {
      concerning_size: string;
      rapid_growth_threshold: string;
      color_change_threshold: string;
    };
    recommendations: string[];
  };
  visualization_data: {
    timeline: Array<{
      date: string;
      confidence: number;
      primary_assessment: string;
      metrics: {
        size_mm?: number;
      };
      has_red_flags?: boolean;
      red_flag_count?: number;
    }>;
    trend_lines: Array<{x: number; y: number}>;
    metrics: {
      size: {
        values: number[];
        unit: string;
        label: string;
      };
    };
  };
  summary: string;
  next_steps: string[];
}

// Analysis History Types
export interface AnalysisHistoryItem {
  id: string;
  analysis_id: string;
  date: string;
  photo_url?: string;
  thumbnail_url?: string;
  primary_assessment: string;
  confidence: number;
  key_metrics?: {
    size_mm?: number;
  };
  has_red_flags?: boolean;
  red_flag_count?: number;
  trend?: 'improving' | 'stable' | 'worsening';
  urgency_level?: string;
  analysis_data?: AnalysisResult; // Full analysis data
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[];
  current_index: number;
  session_info: {
    condition_name: string;
    total_analyses: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}