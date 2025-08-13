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
   * Now fetches from multiple rows based on prediction_type
   */
  async getCurrentPredictions(userId: string): Promise<{ 
    status: 'success' | 'not_found' | 'needs_initial';
    predictions?: WeeklyPredictions;
  }> {
    try {
      // Fetch all current predictions for the user
      const { data: allPredictions, error } = await supabase
        .from('weekly_ai_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .order('generated_at', { ascending: false })

      if (error) {
        console.error('Error fetching predictions:', error)
        return { status: 'not_found' }
      }

      if (!allPredictions || allPredictions.length === 0) {
        console.log('No predictions found for user:', userId)
        
        // Check if user has ANY predictions
        const { data: anyPredictions } = await supabase
          .from('weekly_ai_predictions')
          .select('id')
          .eq('user_id', userId)
          .limit(1)
        
        return {
          status: anyPredictions && anyPredictions.length > 0 ? 'not_found' : 'needs_initial'
        }
      }

      // Group predictions by type
      const predictionsByType = allPredictions.reduce((acc: any, pred) => {
        acc[pred.prediction_type] = pred
        return acc
      }, {})

      // Build the combined predictions object
      const predictions: WeeklyPredictions = {
        id: predictionsByType.dashboard?.id || predictionsByType.immediate?.id || allPredictions[0].id,
        user_id: userId,
        dashboard_alert: predictionsByType.dashboard?.dashboard_alert || null,
        predictions: [
          ...(predictionsByType.immediate?.predictions || []),
          ...(predictionsByType.seasonal?.predictions || []),
          ...(predictionsByType.longterm?.predictions || [])
        ],
        pattern_questions: predictionsByType.questions?.pattern_questions || [],
        body_patterns: predictionsByType.patterns?.body_patterns || {
          tendencies: [],
          positive_responses: []
        },
        generated_at: predictionsByType.dashboard?.generated_at || allPredictions[0].generated_at,
        data_quality_score: predictionsByType.immediate?.data_quality_score || 
                           predictionsByType.dashboard?.data_quality_score || 0,
        is_current: true,
        viewed_at: predictionsByType.dashboard?.viewed_at
      }

      // Mark dashboard as viewed if not already
      if (predictionsByType.dashboard && !predictionsByType.dashboard.viewed_at) {
        await this.markAsViewed(predictionsByType.dashboard.id)
      }

      return {
        status: 'success',
        predictions
      }
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
   * Get immediate predictions only (for 7-day predictions page)
   * Fetches from the correct prediction_type row
   */
  async getImmediatePredictionsOnly(userId: string): Promise<{
    status: 'success' | 'not_found' | 'needs_data' | 'expired' | 'needs_backend';
    predictions?: any[];
    data_quality_score?: number;
    expires_at?: string;
    generated_at?: string;
    cache_valid?: boolean;
  }> {
    try {
      // Query for immediate prediction type specifically
      const { data, error } = await supabase
        .from('weekly_ai_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('prediction_type', 'immediate')
        .eq('is_current', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No immediate predictions found - need backend to generate
          console.log('No immediate predictions in cache for user:', userId)
          return { status: 'needs_backend' };
        }
        throw error
      }

      if (data) {
        // Check if cache is expired
        const now = new Date()
        const expiresAt = data.expires_at ? new Date(data.expires_at) : null
        const cacheValid = !expiresAt || expiresAt > now
        
        // Get predictions directly from the predictions column
        const immediatePredictions = data.predictions || []
        
        // If cache is expired, suggest backend refresh but still return data
        if (!cacheValid) {
          console.log('Cache expired for immediate predictions, expires_at:', data.expires_at)
          return {
            status: 'expired',
            predictions: immediatePredictions,
            data_quality_score: data.data_quality_score || 0,
            expires_at: data.expires_at,
            generated_at: data.generated_at,
            cache_valid: false
          }
        }
        
        // Check data quality
        if (data.data_quality_score < 30) {
          return {
            status: 'needs_data',
            predictions: immediatePredictions,
            data_quality_score: data.data_quality_score,
            expires_at: data.expires_at,
            generated_at: data.generated_at,
            cache_valid: true
          }
        }
        
        return {
          status: immediatePredictions.length > 0 ? 'success' : 'needs_data',
          predictions: immediatePredictions,
          data_quality_score: data.data_quality_score || 0,
          expires_at: data.expires_at,
          generated_at: data.generated_at,
          cache_valid: true
        }
      }
      
      return { status: 'needs_backend' };
    } catch (error) {
      console.error('Error fetching immediate predictions:', error);
      return { status: 'not_found' };
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
        .eq('is_current', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) return null

      // Check if data is expired
      if (data.expires_at) {
        const now = new Date()
        const expiresAt = new Date(data.expires_at)
        if (expiresAt < now) {
          console.log(`${predictionType} predictions expired, expires_at:`, data.expires_at)
        }
      }

      switch (predictionType) {
        case 'dashboard':
          return {
            alert: data.dashboard_alert,
            metadata: data.metadata,
            expires_at: data.expires_at,
            is_current: data.is_current
          }
        case 'patterns':
          return {
            patterns: data.body_patterns,
            metadata: data.metadata,
            expires_at: data.expires_at
          }
        case 'questions':
          return {
            questions: data.pattern_questions,
            metadata: data.metadata,
            expires_at: data.expires_at
          }
        case 'immediate':
        case 'seasonal':
        case 'longterm':
          return {
            predictions: data.predictions || [],
            metadata: data.metadata,
            expires_at: data.expires_at,
            data_quality_score: data.data_quality_score
          }
        default:
          return data
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