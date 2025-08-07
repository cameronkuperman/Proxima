import { supabase } from '@/lib/supabase'

export interface HealthScoreAction {
  icon: string;
  text: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface HealthScoreResponse {
  score: number;
  reasoning: string;
  actions: HealthScoreAction[];
  week_of: string;
  expires_at: string;
  previous_score?: number | null;
  trend?: 'improving' | 'declining' | 'stable' | null;
  created_at: string;
  updated_at: string;
}

class SupabaseHealthScoreService {
  /**
   * Get current health score from Supabase
   */
  async getCurrentHealthScore(userId: string): Promise<{
    status: 'success' | 'not_found' | 'expired';
    data?: HealthScoreResponse;
  }> {
    try {
      // Get the current week's Monday
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      monday.setHours(0, 0, 0, 0)
      const weekOf = monday.toISOString()

      // Fetch the health score for the current week
      const { data, error } = await supabase
        .from('health_scores')
        .select('*')
        .eq('user_id', userId)
        .gte('week_of', weekOf)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No score found for current week
          return { status: 'not_found' }
        }
        throw error
      }

      if (data) {
        // Check if score is expired
        const expiresAt = new Date(data.expires_at)
        if (expiresAt < new Date()) {
          return { status: 'expired' }
        }

        // Get previous week's score for trend
        const previousWeek = new Date(monday)
        previousWeek.setDate(previousWeek.getDate() - 7)
        
        const { data: previousData } = await supabase
          .from('health_scores')
          .select('score')
          .eq('user_id', userId)
          .gte('week_of', previousWeek.toISOString())
          .lt('week_of', weekOf)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Calculate trend
        let trend: 'improving' | 'declining' | 'stable' | null = null
        let previous_score = null
        
        if (previousData) {
          previous_score = previousData.score
          const difference = data.score - previousData.score
          
          if (difference > 2) {
            trend = 'improving'
          } else if (difference < -2) {
            trend = 'declining'
          } else {
            trend = 'stable'
          }
        }

        const healthScore: HealthScoreResponse = {
          score: data.score,
          reasoning: data.reasoning || '',
          actions: data.actions || [],
          week_of: data.week_of,
          expires_at: data.expires_at,
          previous_score,
          trend,
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        return {
          status: 'success',
          data: healthScore
        }
      }

      return { status: 'not_found' }
    } catch (error) {
      console.error('Error fetching health score from Supabase:', error)
      return { status: 'not_found' }
    }
  }

  /**
   * Get health score history
   */
  async getHealthScoreHistory(
    userId: string,
    limit: number = 12
  ): Promise<HealthScoreResponse[]> {
    try {
      const { data, error } = await supabase
        .from('health_scores')
        .select('*')
        .eq('user_id', userId)
        .order('week_of', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Calculate trends for each score
      const scores: HealthScoreResponse[] = []
      
      for (let i = 0; i < (data || []).length; i++) {
        const current = data![i]
        const previous = i < data!.length - 1 ? data![i + 1] : null
        
        let trend: 'improving' | 'declining' | 'stable' | null = null
        if (previous) {
          const difference = current.score - previous.score
          if (difference > 2) {
            trend = 'improving'
          } else if (difference < -2) {
            trend = 'declining'
          } else {
            trend = 'stable'
          }
        }

        scores.push({
          score: current.score,
          reasoning: current.reasoning || '',
          actions: current.actions || [],
          week_of: current.week_of,
          expires_at: current.expires_at,
          previous_score: previous?.score || null,
          trend,
          created_at: current.created_at,
          updated_at: current.updated_at
        })
      }

      return scores
    } catch (error) {
      console.error('Error fetching health score history:', error)
      return []
    }
  }

  /**
   * Check if a new health score can be generated
   */
  async canGenerateNewScore(userId: string): Promise<{
    canGenerate: boolean;
    reason?: string;
    nextAvailable?: string;
  }> {
    try {
      // Check the most recent score
      const { data } = await supabase
        .from('health_scores')
        .select('created_at, expires_at, week_of')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) {
        // No previous scores, can generate
        return { canGenerate: true }
      }

      // Check if current week already has a score
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      monday.setHours(0, 0, 0, 0)
      
      const scoreWeek = new Date(data.week_of)
      
      if (scoreWeek.getTime() === monday.getTime()) {
        // Already have a score for this week
        const expiresAt = new Date(data.expires_at)
        
        if (expiresAt > new Date()) {
          return {
            canGenerate: false,
            reason: 'Health score already exists for this week',
            nextAvailable: data.expires_at
          }
        }
      }

      return { canGenerate: true }
    } catch (error) {
      console.error('Error checking score generation status:', error)
      return { canGenerate: true }
    }
  }

  /**
   * Get weekly trend data for charts
   */
  async getWeeklyTrends(
    userId: string,
    weeks: number = 8
  ): Promise<Array<{ week: string; score: number; trend: string }>> {
    try {
      const { data, error } = await supabase
        .from('health_scores')
        .select('week_of, score')
        .eq('user_id', userId)
        .order('week_of', { ascending: false })
        .limit(weeks)

      if (error) throw error

      const trends: Array<{ week: string; score: number; trend: string }> = []
      
      for (let i = 0; i < (data || []).length; i++) {
        const current = data![i]
        const previous = i < data!.length - 1 ? data![i + 1] : null
        
        let trend = 'stable'
        if (previous) {
          const difference = current.score - previous.score
          if (difference > 2) trend = 'up'
          else if (difference < -2) trend = 'down'
        }

        trends.push({
          week: current.week_of,
          score: current.score,
          trend
        })
      }

      return trends.reverse() // Return in chronological order for charts
    } catch (error) {
      console.error('Error fetching weekly trends:', error)
      return []
    }
  }

  /**
   * Cache health score locally for faster access
   */
  cacheHealthScore(userId: string, data: HealthScoreResponse): void {
    try {
      const key = `health_score_${userId}`
      const cacheData = {
        data,
        timestamp: Date.now(),
        weekOf: data.week_of
      }
      localStorage.setItem(key, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache health score:', error)
    }
  }

  /**
   * Get cached health score
   */
  getCachedHealthScore(userId: string): HealthScoreResponse | null {
    try {
      const key = `health_score_${userId}`
      const cached = localStorage.getItem(key)
      
      if (!cached) return null
      
      const parsed = JSON.parse(cached)
      
      // Check if cache is for current week
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      monday.setHours(0, 0, 0, 0)
      
      const cacheWeek = new Date(parsed.weekOf)
      
      if (cacheWeek.getTime() !== monday.getTime()) {
        // Cache is from a different week, remove it
        localStorage.removeItem(key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.warn('Failed to get cached health score:', error)
      return null
    }
  }
}

export default new SupabaseHealthScoreService()