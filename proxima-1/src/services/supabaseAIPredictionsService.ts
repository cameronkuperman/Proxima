import { supabase } from '@/lib/supabase'

export interface WeeklyPredictions {
  id: string;
  user_id: string;
  dashboard_alert: {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    timeframe: string;
    confidence: number;
    preventionTip?: string;
    actionUrl: string;
    generated_at?: string;
  } | null;
  predictions: Array<{
    id: string;
    type: 'immediate' | 'seasonal' | 'longterm';
    title: string;
    subtitle?: string;
    pattern: string;
    trigger_combo?: string;
    historical_accuracy?: string;
    confidence: number;
    gradient?: string;
    prevention_protocol: string[];
    severity?: 'info' | 'warning' | 'alert';
    description?: string;
    preventionProtocols?: string[];
    category?: string;
    reasoning?: string;
    dataPoints?: string[];
    timeframe?: string;
    historical_context?: string;
  }>;
  pattern_questions: Array<{
    id: string;
    question: string;
    category: 'mood' | 'sleep' | 'energy' | 'physical';
    icon?: string;
    brief_answer: string;
    deep_dive: {
      detailed_insights: string[];
      connected_patterns: string[];
      actionable_advice: string[];
    };
    relevance_score: number;
    based_on: string[];
    answer?: string;
    deepDive?: string[];
    connections?: string[];
    relevanceScore?: number;
    basedOn?: string[];
  }>;
  body_patterns: {
    tendencies: string[];
    positive_responses: string[];
    positiveResponses?: string[];
    pattern_metadata?: {
      total_patterns_analyzed: number;
      confidence_level: 'low' | 'medium' | 'high';
      data_span_days: number;
    };
  };
  generated_at: string;
  data_quality_score: number;
  is_current?: boolean;
  viewed_at?: string;
}

class SupabaseAIPredictionsService {
  /**
   * Fetch current weekly predictions from Supabase
   */
  async getCurrentPredictions(userId: string): Promise<{ 
    status: 'success' | 'not_found' | 'needs_initial';
    predictions?: WeeklyPredictions;
  }> {
    try {
      // Fetch the most recent prediction that is current
      const { data, error } = await supabase
        .from('weekly_ai_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .eq('generation_status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No predictions found
          console.log('No predictions found for user:', userId)
          
          // Check if user has ANY predictions (to determine if it's initial or not found)
          const { data: anyPredictions } = await supabase
            .from('weekly_ai_predictions')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
          
          return {
            status: anyPredictions && anyPredictions.length > 0 ? 'not_found' : 'needs_initial'
          }
        }
        throw error
      }

      if (data) {
        // Transform the data to match the expected format
        const predictions: WeeklyPredictions = {
          id: data.id,
          user_id: data.user_id,
          dashboard_alert: data.dashboard_alert || null,
          predictions: data.predictions || [],
          pattern_questions: data.pattern_questions || [],
          body_patterns: data.body_patterns || {
            tendencies: [],
            positive_responses: []
          },
          generated_at: data.generated_at,
          data_quality_score: data.data_quality_score || 0,
          is_current: data.is_current,
          viewed_at: data.viewed_at
        }

        // Mark as viewed if not already
        if (!data.viewed_at) {
          await this.markAsViewed(data.id)
        }

        return {
          status: 'success',
          predictions
        }
      }

      return { status: 'not_found' }
    } catch (error) {
      console.error('Error fetching predictions from Supabase:', error)
      return { status: 'not_found' }
    }
  }

  /**
   * Get all predictions for a user (for history)
   */
  async getUserPredictions(
    userId: string,
    limit: number = 10
  ): Promise<WeeklyPredictions[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_ai_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('generation_status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        dashboard_alert: item.dashboard_alert || null,
        predictions: item.predictions || [],
        pattern_questions: item.pattern_questions || [],
        body_patterns: item.body_patterns || {
          tendencies: [],
          positive_responses: []
        },
        generated_at: item.generated_at,
        data_quality_score: item.data_quality_score || 0,
        is_current: item.is_current,
        viewed_at: item.viewed_at
      }))
    } catch (error) {
      console.error('Error fetching user predictions:', error)
      return []
    }
  }

  /**
   * Check if user can regenerate predictions
   */
  async canRegenerate(userId: string): Promise<{ 
    canRegenerate: boolean;
    message?: string;
    nextAvailable?: string;
  }> {
    try {
      // Check the most recent prediction
      const { data } = await supabase
        .from('weekly_ai_predictions')
        .select('generated_at, force_refresh_count, regenerate_after')
        .eq('user_id', userId)
        .eq('is_current', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) {
        return { canRegenerate: true }
      }

      // Check regenerate_after timestamp
      if (data.regenerate_after) {
        const now = new Date()
        const regenerateAfter = new Date(data.regenerate_after)
        
        if (now < regenerateAfter) {
          return {
            canRegenerate: false,
            message: 'Please wait before regenerating',
            nextAvailable: data.regenerate_after
          }
        }
      }

      // Check force refresh count (limit 3 per week)
      if (data.force_refresh_count >= 3) {
        const generatedDate = new Date(data.generated_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        if (generatedDate > weekAgo) {
          return {
            canRegenerate: false,
            message: 'Weekly regeneration limit reached (3 per week)',
            nextAvailable: new Date(generatedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }

      return { canRegenerate: true }
    } catch (error) {
      console.error('Error checking regeneration status:', error)
      return { canRegenerate: true }
    }
  }

  /**
   * Mark predictions as viewed
   */
  private async markAsViewed(predictionId: string): Promise<void> {
    try {
      await supabase
        .from('weekly_ai_predictions')
        .update({ 
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', predictionId)
    } catch (error) {
      console.error('Error marking prediction as viewed:', error)
    }
  }

  /**
   * Get prediction by type
   */
  async getPredictionsByType(
    userId: string,
    predictionType: 'immediate' | 'seasonal' | 'longterm' | 'patterns' | 'questions' | 'dashboard'
  ): Promise<any> {
    try {
      const { data } = await supabase
        .from('weekly_ai_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('prediction_type', predictionType)
        .eq('generation_status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) return null

      switch (predictionType) {
        case 'dashboard':
          return data.dashboard_alert
        case 'patterns':
          return data.body_patterns
        case 'questions':
          return data.pattern_questions
        default:
          return data.predictions?.filter((p: any) => p.type === predictionType) || []
      }
    } catch (error) {
      console.error(`Error fetching ${predictionType} predictions:`, error)
      return null
    }
  }

  /**
   * Get AI alerts history
   */
  async getAlertsHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_alerts_log')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching alerts history:', error)
      return []
    }
  }

  /**
   * Log user feedback on predictions
   */
  async logPredictionFeedback(
    predictionId: string,
    wasAccurate: boolean,
    feedback?: string
  ): Promise<void> {
    try {
      // This could update ai_predictions_history or ai_alerts_log
      await supabase
        .from('ai_predictions_history')
        .update({
          outcome_occurred: wasAccurate,
          outcome_date: new Date().toISOString(),
          outcome_notes: feedback
        })
        .eq('id', predictionId)
    } catch (error) {
      console.error('Error logging prediction feedback:', error)
    }
  }
}

export default new SupabaseAIPredictionsService()