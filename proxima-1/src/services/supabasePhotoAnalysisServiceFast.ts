import { supabaseOptimized } from '@/lib/supabase-optimized';
import { PhotoSession } from '@/types/photo-analysis';

export interface PhotoSessionWithCounts extends PhotoSession {
  photo_count: number;
  analysis_count: number;
}

class SupabasePhotoAnalysisServiceFast {
  /**
   * ULTRA-FAST: Fetch photo sessions without counts for initial load
   * Counts are loaded separately if needed
   */
  async fetchPhotoSessionsFast(
    userId: string, 
    includeSensitive: boolean = false,
    limit: number = 20
  ): Promise<PhotoSessionWithCounts[]> {
    console.log('[PhotoSessionsFast] Fetching for user:', userId, { includeSensitive, limit });
    
    try {
      // Ensure userId is in UUID format (remove any quotes if present)
      const cleanUserId = userId.replace(/["']/g, '');
      
      // Simple, fast query - no joins, no counts
      let query = supabaseOptimized
        .from('photo_sessions')
        .select('id, condition_name, description, created_at, updated_at, last_photo_at, is_sensitive')
        .eq('user_id', cleanUserId)  // Supabase handles UUID casting automatically
        .is('deleted_at', null)  // Exclude deleted sessions
        .order('updated_at', { ascending: false })
        .limit(limit);
      
      // Filter sensitive if needed - exclude sensitive for continue tracking
      if (!includeSensitive) {
        query = query.or('is_sensitive.eq.false,is_sensitive.is.null');
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('[PhotoSessionsFast] Supabase error:', error.message || error);
        console.error('[PhotoSessionsFast] Full error object:', error);
        return [];
      }

      console.log('[PhotoSessionsFast] Found', sessions?.length || 0, 'sessions');
      
      if (!sessions || sessions.length === 0) {
        console.log('[PhotoSessionsFast] No sessions found for user:', cleanUserId);
        return [];
      }

      // Return sessions with default counts - load counts lazily later
      return sessions.map(session => ({
        ...session,
        photo_count: 0, // Will be loaded lazily
        analysis_count: 0 // Will be loaded lazily
      }));
    } catch (error) {
      console.error('Error in fetchPhotoSessionsFast:', error);
      return [];
    }
  }

  /**
   * Load counts for sessions (called after initial render)
   */
  async loadSessionCounts(sessionIds: string[]): Promise<Map<string, { photo_count: number; analysis_count: number }>> {
    if (sessionIds.length === 0) return new Map();

    try {
      // Parallel count queries
      const [photoCountsResult, analysisCountsResult] = await Promise.all([
        supabaseOptimized
          .from('photo_uploads')
          .select('session_id')
          .in('session_id', sessionIds),
        
        supabaseOptimized
          .from('photo_analyses')
          .select('session_id')
          .in('session_id', sessionIds)
      ]);

      // Count occurrences
      const photoCounts = new Map<string, number>();
      const analysisCounts = new Map<string, number>();

      (photoCountsResult.data || []).forEach(item => {
        const count = photoCounts.get(item.session_id) || 0;
        photoCounts.set(item.session_id, count + 1);
      });

      (analysisCountsResult.data || []).forEach(item => {
        const count = analysisCounts.get(item.session_id) || 0;
        analysisCounts.set(item.session_id, count + 1);
      });

      // Combine counts
      const result = new Map<string, { photo_count: number; analysis_count: number }>();
      sessionIds.forEach(id => {
        result.set(id, {
          photo_count: photoCounts.get(id) || 0,
          analysis_count: analysisCounts.get(id) || 0
        });
      });

      return result;
    } catch (error) {
      console.error('Error loading counts:', error);
      return new Map();
    }
  }

  /**
   * Get single session by ID (optimized query)
   */
  async getSessionById(sessionId: string): Promise<PhotoSession | null> {
    try {
      const { data, error } = await supabaseOptimized
        .from('photo_sessions')
        .select('id, condition_name, description, created_at, updated_at, last_photo_at, is_sensitive, latest_summary')
        .eq('id', sessionId)
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
}

export const supabasePhotoAnalysisServiceFast = new SupabasePhotoAnalysisServiceFast();