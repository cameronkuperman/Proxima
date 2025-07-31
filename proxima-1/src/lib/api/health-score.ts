// Health Score API Client with Weekly Comparison
import { createClient } from '@supabase/supabase-js';

const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export interface HealthScoreAction {
  icon: string;
  text: string;
}

export interface HealthScoreResponse {
  score: number;
  actions: HealthScoreAction[];
  reasoning?: string;
  generated_at: string;
  expires_at: string;
  cached: boolean;
}

export interface HealthScoreWithComparison extends HealthScoreResponse {
  previousScore?: number;
  trend?: 'up' | 'down' | 'same';
  difference?: number;
}

export class HealthScoreAPI {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Get current health score with previous week comparison
   */
  async getHealthScore(userId: string): Promise<HealthScoreWithComparison> {
    try {
      // First, try to get scores from Supabase (both current and previous week)
      const scores = await this.getScoresFromSupabase(userId);
      
      if (scores.current) {
        // We have the current week's score in Supabase
        return {
          ...scores.current,
          previousScore: scores.previous?.score,
          trend: this.calculateTrend(scores.current.score, scores.previous?.score),
          difference: scores.previous ? scores.current.score - scores.previous.score : undefined
        };
      }

      // If no current score in Supabase, fetch from API
      const apiScore = await this.fetchFromAPI(userId);
      
      // Get previous week's score for comparison
      const previousScore = await this.getPreviousWeekScore(userId);
      
      return {
        ...apiScore,
        previousScore: previousScore?.score,
        trend: this.calculateTrend(apiScore.score, previousScore?.score),
        difference: previousScore ? apiScore.score - previousScore.score : undefined
      };
    } catch (error) {
      console.error('Error fetching health score:', error);
      throw error;
    }
  }

  /**
   * Get scores from Supabase (current and previous week)
   */
  private async getScoresFromSupabase(userId: string) {
    const now = new Date();
    const currentMonday = this.getMonday(now);
    const lastMonday = this.getMonday(new Date(currentMonday.getTime() - 7 * 24 * 60 * 60 * 1000));
    const twoWeeksAgo = this.getMonday(new Date(currentMonday.getTime() - 14 * 24 * 60 * 60 * 1000));

    const { data, error } = await this.supabase
      .from('health_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(2);

    if (error) {
      console.error('Supabase error:', error);
      return { current: null, previous: null };
    }

    if (!data || data.length === 0) {
      return { current: null, previous: null };
    }

    // Identify which scores we have
    const scores = {
      current: null as HealthScoreResponse | null,
      previous: null as HealthScoreResponse | null
    };

    for (const score of data) {
      const scoreDate = new Date(score.created_at);
      
      // Check if this is the current week's score
      if (scoreDate >= currentMonday) {
        scores.current = {
          score: score.score,
          actions: score.actions,
          reasoning: score.reasoning,
          generated_at: score.generated_at,
          expires_at: score.expires_at,
          cached: true
        };
      } 
      // Check if this is last week's score
      else if (scoreDate >= lastMonday && scoreDate < currentMonday) {
        scores.previous = score;
      }
    }

    return scores;
  }

  /**
   * Get previous week's score from Supabase
   */
  private async getPreviousWeekScore(userId: string) {
    const currentMonday = this.getMonday(new Date());
    const lastMonday = this.getMonday(new Date(currentMonday.getTime() - 7 * 24 * 60 * 60 * 1000));

    const { data, error } = await this.supabase
      .from('health_scores')
      .select('score')
      .eq('user_id', userId)
      .gte('created_at', lastMonday.toISOString())
      .lt('created_at', currentMonday.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  /**
   * Fetch health score from API
   */
  private async fetchFromAPI(userId: string): Promise<HealthScoreResponse> {
    const response = await fetch(`${API_URL}/api/health-score/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch health score: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Calculate trend between current and previous scores
   */
  private calculateTrend(current: number, previous?: number): 'up' | 'down' | 'same' | undefined {
    if (previous === undefined || previous === null) {
      return undefined;
    }

    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  }

  /**
   * Get the Monday of the week for a given date
   */
  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Force refresh health score (bypasses cache)
   */
  async refreshHealthScore(userId: string): Promise<HealthScoreWithComparison> {
    const response = await fetch(`${API_URL}/api/health-score/${userId}?force_refresh=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh health score: ${response.statusText}`);
    }

    const apiScore = await response.json();
    const previousScore = await this.getPreviousWeekScore(userId);

    return {
      ...apiScore,
      previousScore: previousScore?.score,
      trend: this.calculateTrend(apiScore.score, previousScore?.score),
      difference: previousScore ? apiScore.score - previousScore.score : undefined
    };
  }
}

export const healthScoreAPI = new HealthScoreAPI();