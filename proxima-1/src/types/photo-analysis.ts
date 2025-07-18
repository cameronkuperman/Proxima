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
  id: string;
  condition_name: string;
  description?: string;
  created_at: string;
  last_photo_at?: string;
  photo_count: number;
  analysis_count: number;
  is_sensitive: boolean;
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