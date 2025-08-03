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
      trend: 'stable' | 'improving' | 'worsening';
      changes: any;
      confidence: number;
      summary: string;
    };
  };
  follow_up_suggestion?: FollowUpSuggestion;
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