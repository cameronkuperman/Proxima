// Health Story Service for Next.js Frontend
import { getSupabaseClient } from './supabase-client';
import { supabase } from './supabase';

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
    title?: string;
    subtitle?: string;
  };
  error?: string;
  message?: string;
}

interface HealthStoryData {
  id: string;
  user_id: string;
  header: string;
  subtitle?: string;
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
  metadata?: {
    title?: string;
    subtitle?: string;
  };
}

interface RefreshInfo {
  used: number;
  remaining: number;
  limit: number;
  week_start: string;
  next_reset: string;
  can_refresh: boolean;
}

// Utility function to extract clean story content
function extractStoryContent(storyData: any): string {
  // If it's already a string, return it
  if (typeof storyData === 'string') {
    // Check if it's a JSON string
    try {
      const parsed = JSON.parse(storyData);
      return parsed.content || storyData;
    } catch {
      return storyData;
    }
  }

  // If it's an object with content field
  if (storyData && typeof storyData === 'object' && storyData.content) {
    return storyData.content;
  }

  return storyData;
}

export const healthStoryService = {
  async getRefreshInfo(userId: string): Promise<RefreshInfo | null> {
    try {
      const supabase = getSupabaseClient();
      
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
          remaining: 10,
          limit: 10,
          week_start: currentWeekStart.toISOString(),
          next_reset: new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          can_refresh: true
        };
      }
      
      const used = count || 0;
      const remaining = Math.max(0, 10 - used);
      
      return {
        used,
        remaining,
        limit: 10,
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

      console.log('Health Story Request:', {
        url: `${API_URL}/api/health-story`,
        body: requestBody
      });

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

      const data = await response.json();
      console.log('Health Story API response:', data);
      
      // Backend returns status: "success" and the story data directly
      if (data.status === 'success' && data.story_id) {
        // Check if it's a rate limit fallback response
        if (data.content && data.content.includes('API issue: 429')) {
          throw new Error('Rate limit reached. Please try again in a few moments.');
        }
        
        // Extract clean content from the response
        const cleanContent = extractStoryContent(data.content);
        
        // Transform backend response to expected frontend format
        return {
          success: true,
          health_story: {
            story_id: data.story_id,
            header: data.title || data.header, // Backend now sends 'title'
            story_text: cleanContent, // Use clean content
            generated_date: data.date,
            // Include original title and subtitle for metadata
            title: data.title,
            subtitle: data.subtitle
          }
        };
      }
      
      // Handle error response
      const errorMessage = data.error || data.message || 'Health story generation failed';
      console.error('API returned error:', errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      console.error('Health story generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a 404 error indicating the endpoint doesn't exist
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return {
          success: false,
          error: 'Health story generation is not available yet. The backend endpoint is not implemented.',
          message: 'This feature is coming soon. Please check back later.'
        };
      }
      
      return {
        success: false,
        error: 'Failed to generate health story',
        message: errorMessage
      };
    }
  },

  async saveHealthStory(story: HealthStoryData & { title?: string; subtitle?: string }): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      // Ensure we're saving clean content
      const cleanContent = extractStoryContent(story.story_text);
      
      // Map to the actual database schema
      const dbRecord = {
        id: story.id,
        user_id: story.user_id,
        header: story.header, // Keep using header column for now
        story_text: cleanContent, // Save clean content without JSON structure
        generated_date: story.generated_date,
        data_sources: story.data_sources,
        created_at: story.created_at,
        // Store title and subtitle in their respective columns
        title: story.title,
        subtitle: story.subtitle
      };
      
      const { error } = await supabase
        .from('health_stories')
        .insert([dbRecord]);
      
      if (error) {
        console.error('Error saving health story to Supabase:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving health story:', error);
      return false;
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

  // Direct Supabase read methods (faster than API)
  async getHealthStoriesFromSupabase(userId: string): Promise<HealthStoryData[]> {
    try {
      const { data, error } = await supabase
        .from('health_stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching health stories from Supabase:', error);
        return [];
      }

      return (data || []).map(story => ({
        id: story.id,
        user_id: story.user_id,
        header: story.header || story.title || 'Health Story',
        subtitle: story.subtitle,
        story_text: extractStoryContent(story.story_text),
        generated_date: story.generated_date || story.created_at,
        date_range: story.date_range,
        data_sources: story.data_sources,
        created_at: story.created_at,
        metadata: {
          title: story.title,
          subtitle: story.subtitle
        }
      }));
    } catch (error) {
      console.error('Error fetching health stories:', error);
      return [];
    }
  },

  async getLatestHealthStoryFromSupabase(userId: string): Promise<HealthStoryData | null> {
    try {
      const { data, error } = await supabase
        .from('health_stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No stories found
          return null;
        }
        console.error('Error fetching latest health story:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          header: data.header || data.title || 'Health Story',
          subtitle: data.subtitle,
          story_text: extractStoryContent(data.story_text),
          generated_date: data.generated_date || data.created_at,
          date_range: data.date_range,
          data_sources: data.data_sources,
          created_at: data.created_at,
          metadata: {
            title: data.title,
            subtitle: data.subtitle
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching latest health story:', error);
      return null;
    }
  },

  async getHealthStoryByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HealthStoryData | null> {
    try {
      const { data, error } = await supabase
        .from('health_stories')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching health story by date range:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          header: data.header || data.title || 'Health Story',
          subtitle: data.subtitle,
          story_text: extractStoryContent(data.story_text),
          generated_date: data.generated_date || data.created_at,
          date_range: data.date_range,
          data_sources: data.data_sources,
          created_at: data.created_at,
          metadata: {
            title: data.title,
            subtitle: data.subtitle
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching health story by date range:', error);
      return null;
    }
  },

  async getHealthStories(userId: string): Promise<HealthStoryData[]> {
    try {
      const supabase = getSupabaseClient();
      
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
      return (data || []).map((story: any) => {
        // Extract clean content if story_text contains JSON structure
        const cleanContent = extractStoryContent(story.story_text);
        
        return {
          id: story.id,
          user_id: story.user_id,
          header: story.header || story.title, // Use title if header is empty
          subtitle: story.subtitle,
          story_text: cleanContent, // Return clean content
          generated_date: story.generated_date,
          date_range: story.date_range,
          data_sources: story.data_sources,
          created_at: story.created_at,
          metadata: {
            title: story.title,
            subtitle: story.subtitle
          }
        };
      });
    } catch (error) {
      console.error('Error fetching health stories:', error);
      return [];
    }
  }
};

// Export types for use in components
export type { HealthStoryRequest, HealthStoryResponse, HealthStoryData, RefreshInfo };