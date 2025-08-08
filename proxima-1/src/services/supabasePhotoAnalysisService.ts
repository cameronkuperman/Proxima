import { supabase } from '@/lib/supabase';
import { 
  PhotoSession, 
  PhotoUpload, 
  AnalysisResult,
  AnalysisHistoryResponse,
  ProgressionAnalysisResponse,
  SessionTimeline,
  TimelineEvent,
  ReminderConfig
} from '@/types/photo-analysis';

export interface PhotoSessionWithCounts extends PhotoSession {
  photo_count: number;
  analysis_count: number;
}

export interface PhotoAnalysisRecord {
  id: string;
  session_id: string;
  photo_ids: string[];
  analysis_data: {
    primary_assessment: string;
    confidence: number;
    visual_observations: string[];
    differential_diagnosis: string[];
    recommendations: string[];
    red_flags: string[];
    trackable_metrics?: any[];
  };
  comparison_data?: any;
  confidence_score?: number;
  created_at: string;
  expires_at?: string;
}

export interface PhotoUploadRecord {
  id: string;
  session_id: string;
  category: string;
  storage_url?: string;
  file_metadata?: any;
  uploaded_at: string;
  is_followup?: boolean;
  quality_score?: number;
}

export interface PhotoReminderRecord {
  id: string;
  session_id: string;
  analysis_id: string;
  enabled: boolean;
  interval_days: number;
  reminder_method: string;
  reminder_text?: string;
  next_reminder_date?: string;
  ai_reasoning?: string;
  created_at: string;
  updated_at: string;
}

class SupabasePhotoAnalysisService {
  /**
   * Fetch all photo sessions for a user
   * @param userId - User ID
   * @param includeSensitive - Whether to include sensitive sessions (default: false for continue tracking)
   */
  async fetchPhotoSessions(
    userId: string, 
    includeSensitive: boolean = false,
    limit: number = 20
  ): Promise<PhotoSessionWithCounts[]> {
    try {
      // First, fetch sessions without counts for speed
      let query = supabase
        .from('photo_sessions')
        .select('id, condition_name, description, created_at, updated_at, last_photo_at, is_sensitive')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(limit);
      
      // Filter out sensitive sessions for continue tracking
      if (!includeSensitive) {
        query = query.eq('is_sensitive', false);
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('Error fetching photo sessions:', error);
        throw error;
      }

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Get session IDs for batch count query
      const sessionIds = sessions.map(s => s.id);

      // Fetch counts separately using aggregate functions (much faster)
      const [photoCountsResult, analysisCountsResult] = await Promise.all([
        // Get photo counts
        supabase
          .from('photo_uploads')
          .select('session_id, count:id.count()')
          .in('session_id', sessionIds)
          .is('deleted_at', null),
        
        // Get analysis counts  
        supabase
          .from('photo_analyses')
          .select('session_id, count:id.count()')
          .in('session_id', sessionIds)
      ]);

      // Create count maps for quick lookup
      const photoCounts = new Map(
        (photoCountsResult.data || []).map(item => [
          item.session_id,
          parseInt(item.count as any) || 0
        ])
      );

      const analysisCounts = new Map(
        (analysisCountsResult.data || []).map(item => [
          item.session_id,
          parseInt(item.count as any) || 0
        ])
      );

      // Combine sessions with their counts
      const sessionsWithCounts = sessions.map(session => ({
        ...session,
        photo_count: photoCounts.get(session.id) || 0,
        analysis_count: analysisCounts.get(session.id) || 0
      }));

      return sessionsWithCounts;
    } catch (error) {
      console.error('Error in fetchPhotoSessions:', error);
      return [];
    }
  }

  /**
   * Get a single photo session by ID
   */
  async getSessionById(sessionId: string): Promise<PhotoSession | null> {
    try {
      const { data, error } = await supabase
        .from('photo_sessions')
        .select('*')
        .eq('id', sessionId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSessionById:', error);
      return null;
    }
  }

  /**
   * Get signed URL for a photo from Supabase Storage
   * URLs expire after 1 hour
   */
  async getPhotoUrl(photoPath: string): Promise<string | null> {
    try {
      if (!photoPath) return null;
      
      // Generate signed URL for the medical-photos bucket
      const { data, error } = await supabase.storage
        .from('medical-photos')
        .createSignedUrl(photoPath, 3600); // 1 hour expiry
      
      if (error) {
        console.error('Error generating signed URL:', error);
        return null;
      }
      
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error in getPhotoUrl:', error);
      return null;
    }
  }

  /**
   * Get all photos for a session
   * @param sessionId - Session ID
   * @param excludeSensitive - Whether to exclude sensitive photos (default: true)
   */
  async getSessionPhotos(
    sessionId: string, 
    excludeSensitive: boolean = true
  ): Promise<PhotoUploadRecord[]> {
    try {
      let query = supabase
        .from('photo_uploads')
        .select('*')
        .eq('session_id', sessionId)
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false });
      
      // Exclude sensitive photos by category
      if (excludeSensitive) {
        query = query.not('category', 'eq', 'medical_sensitive');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching session photos:', error);
        throw error;
      }

      // Generate signed URLs for each photo
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          if (photo.storage_url) {
            const signedUrl = await this.getPhotoUrl(photo.storage_url);
            return {
              ...photo,
              preview_url: signedUrl
            };
          }
          return photo;
        })
      );

      return photosWithUrls;
    } catch (error) {
      console.error('Error in getSessionPhotos:', error);
      return [];
    }
  }

  /**
   * Get all analyses for a session
   */
  async getAnalysesBySession(sessionId: string): Promise<PhotoAnalysisRecord[]> {
    try {
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyses:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAnalysesBySession:', error);
      return [];
    }
  }

  /**
   * Get analysis history for a session
   */
  async getAnalysisHistory(
    sessionId: string, 
    currentAnalysisId?: string
  ): Promise<AnalysisHistoryResponse> {
    try {
      // Fetch all analyses for the session
      const analyses = await this.getAnalysesBySession(sessionId);
      
      // Get session info
      const session = await this.getSessionById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Get photos for each analysis
      const analysisHistory = await Promise.all(
        analyses.map(async (analysis, index) => {
          // Get the first photo from the analysis
          const photoId = analysis.photo_ids?.[0];
          let photoUrl = null;
          let thumbnailUrl = null;
          
          if (photoId) {
            const { data: photo } = await supabase
              .from('photo_uploads')
              .select('storage_url')
              .eq('id', photoId)
              .single();
            
            if (photo?.storage_url) {
              photoUrl = await this.getPhotoUrl(photo.storage_url);
              thumbnailUrl = photoUrl; // Use same URL for now
            }
          }
          
          return {
            id: analysis.id,
            analysis_id: analysis.id,
            date: analysis.created_at,
            photo_url: photoUrl,
            thumbnail_url: thumbnailUrl,
            primary_assessment: analysis.analysis_data?.primary_assessment || '',
            confidence: analysis.analysis_data?.confidence || 0,
            key_metrics: {
              size_mm: analysis.analysis_data?.trackable_metrics?.[0]?.current_value
            },
            has_red_flags: (analysis.analysis_data?.red_flags?.length || 0) > 0,
            red_flag_count: analysis.analysis_data?.red_flags?.length || 0,
            analysis_data: {
              analysis_id: analysis.id,
              analysis: analysis.analysis_data,
              comparison: analysis.comparison_data
            }
          };
        })
      );

      // Find current analysis index
      const currentIndex = currentAnalysisId 
        ? analysisHistory.findIndex(a => a.analysis_id === currentAnalysisId)
        : 0;

      return {
        analyses: analysisHistory,
        current_index: currentIndex >= 0 ? currentIndex : 0,
        session_info: {
          condition_name: session.condition_name,
          total_analyses: analysisHistory.length,
          date_range: {
            start: analysisHistory[analysisHistory.length - 1]?.date || '',
            end: analysisHistory[0]?.date || ''
          }
        }
      };
    } catch (error) {
      console.error('Error in getAnalysisHistory:', error);
      throw error;
    }
  }

  /**
   * Get progression analysis for a session
   */
  async getProgressionAnalysis(sessionId: string): Promise<ProgressionAnalysisResponse | null> {
    try {
      const analyses = await this.getAnalysesBySession(sessionId);
      
      if (analyses.length < 2) {
        return null; // Need at least 2 analyses for progression
      }

      // Calculate progression metrics
      const timelineData = analyses.map(analysis => ({
        date: analysis.created_at,
        confidence: analysis.analysis_data?.confidence || 0,
        primary_assessment: analysis.analysis_data?.primary_assessment || '',
        metrics: {
          size_mm: analysis.analysis_data?.trackable_metrics?.[0]?.current_value
        },
        has_red_flags: (analysis.analysis_data?.red_flags?.length || 0) > 0,
        red_flag_count: analysis.analysis_data?.red_flags?.length || 0
      }));

      // Calculate trends (simplified version)
      const sizes = timelineData
        .map(d => d.metrics.size_mm)
        .filter(s => s !== undefined) as number[];
      
      let overallTrend: 'growing' | 'shrinking' | 'stable' = 'stable';
      if (sizes.length >= 2) {
        const firstSize = sizes[sizes.length - 1];
        const lastSize = sizes[0];
        const change = lastSize - firstSize;
        
        if (change > firstSize * 0.1) overallTrend = 'growing';
        else if (change < -firstSize * 0.1) overallTrend = 'shrinking';
      }

      return {
        progression_metrics: {
          velocity: {
            overall_trend: overallTrend,
            size_change_rate: 'Calculating...',
            acceleration: 'stable',
            projected_size_30d: 'Calculating...',
            monitoring_phase: analyses.length < 3 ? 'initial' : 'active_monitoring'
          },
          risk_indicators: {
            rapid_growth: false,
            color_darkening: false,
            border_irregularity_increase: false,
            new_colors_appearing: false,
            asymmetry_increasing: false,
            overall_risk_level: 'low'
          },
          clinical_thresholds: {
            concerning_size: '> 6mm',
            rapid_growth_threshold: '> 20% in 30 days',
            color_change_threshold: 'New colors appearing'
          },
          recommendations: [
            'Continue monitoring with photos every 2 weeks',
            'Watch for any rapid changes in size or color'
          ]
        },
        visualization_data: {
          timeline: timelineData.reverse(), // Chronological order
          trend_lines: sizes.map((y, x) => ({ x, y })),
          metrics: {
            size: {
              values: sizes.reverse(),
              unit: 'mm',
              label: 'Size (mm)'
            }
          }
        },
        summary: `Based on ${analyses.length} analyses over time, the condition shows ${overallTrend} trend.`,
        next_steps: [
          'Continue regular photo documentation',
          'Consider medical consultation if rapid changes occur'
        ]
      };
    } catch (error) {
      console.error('Error in getProgressionAnalysis:', error);
      return null;
    }
  }

  /**
   * Get session timeline with all events
   */
  async getSessionTimeline(sessionId: string): Promise<SessionTimeline> {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get photos and analyses
      const [photos, analyses, reminders] = await Promise.all([
        this.getSessionPhotos(sessionId, false), // Include all photos for timeline
        this.getAnalysesBySession(sessionId),
        this.getActiveReminders(sessionId)
      ]);

      // Create timeline events
      const events: TimelineEvent[] = [];
      
      // Add photo upload events
      photos.forEach(photo => {
        events.push({
          date: photo.uploaded_at,
          type: photo.is_followup ? 'follow_up' : 'photo_upload',
          photos: [{
            id: photo.id,
            category: photo.category as any,
            stored: true,
            preview_url: photo.preview_url
          }],
          status: 'completed'
        });
      });

      // Add analysis events
      analyses.forEach(analysis => {
        const analysisDate = new Date(analysis.created_at);
        const existingEvent = events.find(e => 
          Math.abs(new Date(e.date).getTime() - analysisDate.getTime()) < 60000 // Within 1 minute
        );
        
        if (existingEvent) {
          existingEvent.analysis_summary = analysis.analysis_data?.primary_assessment;
        }
      });

      // Add scheduled reminders
      reminders.forEach(reminder => {
        if (reminder.next_reminder_date) {
          events.push({
            date: reminder.next_reminder_date,
            type: 'scheduled_reminder',
            status: 'upcoming',
            message: reminder.reminder_text || 'Time for a follow-up photo'
          });
        }
      });

      // Sort events by date
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate next action
      const now = new Date();
      const upcomingReminder = reminders.find(r => 
        r.next_reminder_date && new Date(r.next_reminder_date) > now
      );
      
      let nextAction = undefined;
      if (upcomingReminder && upcomingReminder.next_reminder_date) {
        const nextDate = new Date(upcomingReminder.next_reminder_date);
        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        nextAction = {
          type: 'photo_follow_up' as const,
          date: upcomingReminder.next_reminder_date,
          days_until: daysUntil
        };
      }

      // Calculate overall trend
      let overallTrend = undefined;
      if (analyses.length >= 2) {
        const progression = await this.getProgressionAnalysis(sessionId);
        if (progression) {
          overallTrend = {
            direction: progression.progression_metrics.velocity.overall_trend === 'growing' ? 'worsening' :
                      progression.progression_metrics.velocity.overall_trend === 'shrinking' ? 'improving' : 
                      'stable' as any,
            total_duration_days: Math.ceil(
              (new Date(analyses[0].created_at).getTime() - 
               new Date(analyses[analyses.length - 1].created_at).getTime()) / 
              (1000 * 60 * 60 * 24)
            ),
            number_of_checks: analyses.length
          };
        }
      }

      return {
        session,
        timeline_events: events,
        next_action,
        overall_trend: overallTrend
      };
    } catch (error) {
      console.error('Error in getSessionTimeline:', error);
      throw error;
    }
  }

  /**
   * Get active reminders for a user or session
   */
  async getActiveReminders(sessionId?: string): Promise<PhotoReminderRecord[]> {
    try {
      let query = supabase
        .from('photo_reminders')
        .select('*')
        .eq('enabled', true);
      
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reminders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveReminders:', error);
      return [];
    }
  }

  /**
   * Get photo comparisons for a session
   */
  async getPhotoComparisons(sessionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('photo_comparisons')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comparisons:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPhotoComparisons:', error);
      return [];
    }
  }

  /**
   * Check if a session has sensitive photos
   */
  async hasSensitivePhotos(sessionId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('photo_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('category', 'medical_sensitive');

      if (error) {
        console.error('Error checking sensitive photos:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error in hasSensitivePhotos:', error);
      return false;
    }
  }

  /**
   * Get count of hidden sensitive photos for a session
   */
  async getSensitivePhotoCount(sessionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('photo_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('category', 'medical_sensitive');

      if (error) {
        console.error('Error counting sensitive photos:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getSensitivePhotoCount:', error);
      return 0;
    }
  }
}

export const supabasePhotoAnalysisService = new SupabasePhotoAnalysisService();