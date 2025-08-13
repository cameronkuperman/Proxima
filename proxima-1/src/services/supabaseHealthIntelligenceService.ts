import { supabase } from '@/lib/supabase';
import { startOfWeek, subWeeks, format } from 'date-fns';

export interface HealthInsight {
  id: string;
  user_id: string;
  insight_type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  confidence: number;
  week_of: string;
  metadata?: {
    data_points?: string[];
    related_symptoms?: string[];
    body_systems?: string[];
    [key: string]: any;
  };
  generation_method?: string;
  created_at: string;
}

export interface ShadowPattern {
  id: string;
  user_id: string;
  pattern_name: string;
  pattern_category: 'exercise' | 'sleep' | 'medication' | 'symptom' | 'other';
  last_seen_description: string;
  significance: 'high' | 'medium' | 'low';
  last_mentioned_date?: string;
  days_missing: number;
  historical_frequency?: {
    weekly_average?: number;
    consistency_score?: number;
    impact_on_wellbeing?: string;
  };
  week_of: string;
  created_at: string;
}

export interface StrategicMove {
  id: string;
  user_id: string;
  strategy: string;
  strategy_type: 'discovery' | 'pattern' | 'prevention' | 'optimization';
  priority: number;
  rationale?: string;
  expected_outcome?: string;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  week_of: string;
  created_at: string;
}

export interface HealthScore {
  id: string;
  user_id: string;
  score: number;
  reasoning: string;
  actions: Array<{
    icon: string;
    text: string;
    category: string;
  }>;
  week_of: string;
  expires_at?: string;
  created_at: string;
}

export interface WeeklyIntelligenceData {
  insights: HealthInsight[];
  shadowPatterns: ShadowPattern[];
  strategicMoves: StrategicMove[];
  healthScore: HealthScore | null;
  weekOf: string;
  isCurrentWeek: boolean;
  previousWeekAvailable?: boolean;
}

class SupabaseHealthIntelligenceService {
  /**
   * Helper to get current week's Monday
   */
  getCurrentWeekMonday(): string {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
    return format(monday, 'yyyy-MM-dd');
  }

  /**
   * Helper to get previous week's Monday
   */
  getPreviousWeekMonday(): string {
    const today = new Date();
    const lastWeekMonday = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    return format(lastWeekMonday, 'yyyy-MM-dd');
  }

  /**
   * Fetch health insights for a specific week
   */
  async fetchHealthInsights(userId: string, weekOf: string): Promise<HealthInsight[]> {
    try {
      const { data, error } = await supabase
        .from('health_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('week_of', weekOf)
        .order('confidence', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching health insights:', error);
      return [];
    }
  }

  /**
   * Fetch shadow patterns for a specific week
   */
  async fetchShadowPatterns(userId: string, weekOf: string): Promise<ShadowPattern[]> {
    try {
      const { data, error } = await supabase
        .from('shadow_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('week_of', weekOf)
        .order('significance', { ascending: false });

      if (error) throw error;
      
      // Sort by significance priority: high > medium > low
      const significanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (data || []).sort((a, b) => 
        significanceOrder[a.significance] - significanceOrder[b.significance]
      );
    } catch (error) {
      console.error('Error fetching shadow patterns:', error);
      return [];
    }
  }

  /**
   * Fetch strategic moves for a specific week
   */
  async fetchStrategicMoves(userId: string, weekOf: string): Promise<StrategicMove[]> {
    try {
      const { data, error } = await supabase
        .from('strategic_moves')
        .select('*')
        .eq('user_id', userId)
        .eq('week_of', weekOf)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching strategic moves:', error);
      return [];
    }
  }

  /**
   * Fetch latest health score
   */
  async fetchHealthScore(userId: string): Promise<HealthScore | null> {
    try {
      const { data, error } = await supabase
        .from('health_scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (error) {
      console.error('Error fetching health score:', error);
      return null;
    }
  }

  /**
   * Fetch all weekly intelligence data
   */
  async fetchAllWeeklyIntelligence(userId: string): Promise<WeeklyIntelligenceData> {
    const currentWeekMonday = this.getCurrentWeekMonday();
    const previousWeekMonday = this.getPreviousWeekMonday();
    
    console.log('Fetching intelligence for week:', currentWeekMonday);

    // First try current week
    const [insights, shadowPatterns, strategicMoves, healthScore] = await Promise.all([
      this.fetchHealthInsights(userId, currentWeekMonday),
      this.fetchShadowPatterns(userId, currentWeekMonday),
      this.fetchStrategicMoves(userId, currentWeekMonday),
      this.fetchHealthScore(userId)
    ]);

    // Check if we have any data for current week
    const hasCurrentWeekData = 
      insights.length > 0 || 
      shadowPatterns.length > 0 || 
      strategicMoves.length > 0;

    // If no current week data, try previous week
    if (!hasCurrentWeekData) {
      console.log('No current week data, fetching previous week:', previousWeekMonday);
      
      const [prevInsights, prevPatterns, prevMoves] = await Promise.all([
        this.fetchHealthInsights(userId, previousWeekMonday),
        this.fetchShadowPatterns(userId, previousWeekMonday),
        this.fetchStrategicMoves(userId, previousWeekMonday)
      ]);

      return {
        insights: prevInsights,
        shadowPatterns: prevPatterns,
        strategicMoves: prevMoves,
        healthScore,
        weekOf: previousWeekMonday,
        isCurrentWeek: false,
        previousWeekAvailable: true
      };
    }

    return {
      insights,
      shadowPatterns,
      strategicMoves,
      healthScore,
      weekOf: currentWeekMonday,
      isCurrentWeek: true
    };
  }

  /**
   * Update strategic move completion status
   */
  async updateStrategicMoveStatus(
    moveId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('strategic_moves')
        .update({ completion_status: status })
        .eq('id', moveId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating strategic move status:', error);
      return false;
    }
  }

  /**
   * Group insights by type
   */
  groupInsightsByType(insights: HealthInsight[]): Record<string, HealthInsight[]> {
    return insights.reduce((acc, insight) => {
      const type = insight.insight_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(insight);
      return acc;
    }, {} as Record<string, HealthInsight[]>);
  }

  /**
   * Check if data needs refresh (older than 7 days)
   */
  isDataStale(weekOf: string): boolean {
    const dataDate = new Date(weekOf);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7;
  }
}

export const healthIntelligenceService = new SupabaseHealthIntelligenceService();