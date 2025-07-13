// Health Story Service for Next.js Frontend

const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
console.log('Health Story API URL:', API_URL);

interface HealthStoryRequest {
  user_id: string;
  date_range?: {
    start: string; // ISO date string
    end: string;   // ISO date string
  };
  include_data?: {
    oracle_chats?: boolean;
    deep_dives?: boolean;
    quick_scans?: boolean;
    medical_profile?: boolean;
  };
}

interface HealthStoryResponse {
  success: boolean;
  health_story?: {
    header: string;
    story_text: string;
    generated_date: string;
    story_id: string;
  };
  error?: string;
  message?: string;
}

interface HealthStoryData {
  id: string;
  user_id: string;
  header: string;
  story_text: string;
  generated_date: string;
  date_range?: {
    start: string;
    end: string;
  };
  data_sources?: {
    oracle_chats: number;
    quick_scans: number;
    deep_dives: number;
    symptom_entries: number;
  };
  created_at: string;
}

interface RefreshInfo {
  used: number;
  remaining: number;
  limit: number;
  week_start: string;
  next_reset: string;
  can_refresh: boolean;
}

export const healthStoryService = {
  async getRefreshInfo(userId: string): Promise<RefreshInfo | null> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Get current week start (Monday 9 AM UTC)
      const currentWeekStart = this.getCurrentWeekStart();
      
      // Count refreshes for this week
      const { count, error } = await supabase
        .from('health_story_refreshes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('refreshed_at', currentWeekStart.toISOString());
      
      if (error) {
        console.error('Error getting refresh count:', error);
        // Return default info if table doesn't exist yet
        return {
          used: 0,
          remaining: 3,
          limit: 3,
          week_start: currentWeekStart.toISOString(),
          next_reset: new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          can_refresh: true
        };
      }
      
      const used = count || 0;
      const remaining = Math.max(0, 3 - used);
      
      return {
        used,
        remaining,
        limit: 3,
        week_start: currentWeekStart.toISOString(),
        next_reset: new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        can_refresh: remaining > 0
      };
    } catch (error) {
      console.error('Error getting refresh info:', error);
      return null;
    }
  },

  getCurrentWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Get Monday of current week
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() - daysFromMonday);
    monday.setUTCHours(9, 0, 0, 0);
    
    // If we haven't reached this week's reset time yet, use last week's
    if (now < monday) {
      monday.setUTCDate(monday.getUTCDate() - 7);
    }
    
    return monday;
  },

  async checkAndRecordRefresh(userId: string): Promise<{ success: boolean; refreshInfo?: RefreshInfo; error?: string }> {
    try {
      // First check if user can refresh
      const refreshInfo = await this.getRefreshInfo(userId);
      
      if (!refreshInfo) {
        return { success: false, error: 'Failed to check refresh limit' };
      }
      
      if (!refreshInfo.can_refresh) {
        return { 
          success: false, 
          error: 'You have reached your weekly refresh limit (3 refreshes)',
          refreshInfo
        };
      }
      
      // Record the refresh
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { error } = await supabase
        .from('health_story_refreshes')
        .insert({
          user_id: userId,
          week_start: this.getCurrentWeekStart().toISOString()
        });
      
      if (error) {
        console.error('Error recording refresh:', error);
        // If table doesn't exist, still allow the refresh
        if (error.message.includes('does not exist')) {
          return { 
            success: true,
            refreshInfo: await this.getRefreshInfo(userId) || refreshInfo
          };
        }
        return { success: false, error: 'Failed to record refresh' };
      }
      
      // Get updated refresh info
      const updatedInfo = await this.getRefreshInfo(userId);
      
      return { 
        success: true,
        refreshInfo: updatedInfo || refreshInfo
      };
    } catch (error) {
      console.error('Error checking refresh limit:', error);
      return { success: false, error: 'Failed to check refresh limit' };
    }
  },
  async generateHealthStory(
    userId: string,
    dateRange?: { start: string; end: string }
  ): Promise<HealthStoryResponse> {
    try {
      const requestBody: HealthStoryRequest = {
        user_id: userId,
        date_range: dateRange,
        include_data: {
          oracle_chats: true,
          deep_dives: true,
          quick_scans: true,
          medical_profile: true
        }
      };

      const response = await fetch(`${API_URL}/api/health-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Health story generation failed: ${response.statusText}`);
      }

      const data: HealthStoryResponse = await response.json();
      console.log('Health Story API response:', JSON.stringify(data, null, 2));
      
      if (!data.success) {
        console.error('API returned error status:', data.error);
        throw new Error(data.error || 'Health story generation failed');
      }

      return data;
    } catch (error) {
      console.error('Health story generation error:', error);
      return {
        success: false,
        error: 'Failed to generate health story',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async generateWeeklyHealthStory(userId: string): Promise<HealthStoryResponse> {
    // Helper method to generate story for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return this.generateHealthStory(userId, {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });
  },

  async getHealthStories(userId: string): Promise<HealthStoryData[]> {
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase
        .from('health_stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10); // Get last 10 stories
      
      if (error) {
        console.error('Error fetching health stories from Supabase:', error);
        return [];
      }
      
      // Map the database records to our HealthStoryData type
      return (data || []).map(story => ({
        id: story.id,
        user_id: story.user_id,
        header: story.header,
        story_text: story.story_text,
        generated_date: story.generated_date,
        date_range: story.date_range,
        data_sources: story.data_sources,
        created_at: story.created_at
      }));
    } catch (error) {
      console.error('Error fetching health stories:', error);
      return [];
    }
  }
};

// Export types for use in components
export type { HealthStoryRequest, HealthStoryResponse, HealthStoryData, RefreshInfo };