import { supabase } from '@/lib/supabase'

export interface TrackingSuggestion {
  suggestion_id: string
  suggestion: {
    metric_name: string
    metric_description: string
    y_axis_label: string
    y_axis_type: 'numeric' | 'categorical'
    y_axis_min?: number
    y_axis_max?: number
    tracking_type: string
    confidence_score: number
  }
  status: 'success' | 'error'
}

export interface TrackingConfiguration {
  id: string
  user_id: string
  metric_name: string
  y_axis_label: string
  y_axis_type: 'numeric' | 'categorical'
  y_axis_min?: number
  y_axis_max?: number
  tracking_type: string
  show_on_homepage: boolean
  created_at: string
}

export interface DashboardItem {
  type: 'active' | 'suggestion'
  id: string
  metric_name: string
  description?: string
  y_axis_label?: string
  latest_value?: number
  latest_date?: string
  trend?: 'increasing' | 'decreasing' | 'stable'
  chart_type?: 'line' | 'bar'
  color?: string
  data_points_count?: number
  source_type?: 'quick_scan' | 'deep_dive'
  confidence_score?: number
  created_at?: string
}

export interface ChartData {
  config: {
    metric_name: string
    x_axis_label: string
    y_axis_label: string
    y_axis_min?: number
    y_axis_max?: number
    chart_type: 'line' | 'bar'
    color: string
  }
  data: Array<{
    x: string
    y: number
    notes?: string
  }>
  statistics: {
    average: number
    min: number
    max: number
    count: number
  }
}

export interface PastScan {
  id: string
  date: string
  body_part: string
  primary_condition: string
  symptoms: string[]
  urgency: string
  has_tracking: boolean
}

class SupabaseTrackingService {
  async getDashboard(userId: string): Promise<{
    dashboard_items: DashboardItem[]
    total_active: number
    total_suggestions: number
    status: string
  }> {
    try {
      // Fetch active tracking configurations
      const { data: activeConfigs, error: configError } = await supabase
        .from('tracking_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .eq('show_on_homepage', true)
        .order('display_order', { ascending: true })

      if (configError) throw configError

      // Fetch latest data points for each configuration
      const dashboardItems: DashboardItem[] = []
      
      for (const config of activeConfigs || []) {
        // Get latest data point
        const { data: latestData } = await supabase
          .from('tracking_data_points')
          .select('value, recorded_at')
          .eq('configuration_id', config.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single()

        // Get data points for trend calculation (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { data: trendData } = await supabase
          .from('tracking_data_points')
          .select('value, recorded_at')
          .eq('configuration_id', config.id)
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true })

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
        if (trendData && trendData.length > 1) {
          const firstValue = trendData[0].value
          const lastValue = trendData[trendData.length - 1].value
          const change = ((lastValue - firstValue) / firstValue) * 100
          
          if (change > 5) trend = 'increasing'
          else if (change < -5) trend = 'decreasing'
        }

        dashboardItems.push({
          type: 'active',
          id: config.id,
          metric_name: config.metric_name,
          description: config.metric_description,
          y_axis_label: config.y_axis_label,
          latest_value: latestData?.value,
          latest_date: latestData?.recorded_at,
          trend,
          chart_type: config.chart_type || 'line',
          color: config.color || '#3B82F6',
          data_points_count: config.data_points_count || 0,
          source_type: config.source_type,
          created_at: config.created_at
        })
      }

      // Fetch pending tracking suggestions
      const { data: suggestions, error: suggestionError } = await supabase
        .from('tracking_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('action_taken', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      if (suggestionError) throw suggestionError

      // Add suggestions to dashboard
      for (const suggestion of suggestions || []) {
        const suggestionData = suggestion.suggestions?.[0]
        if (suggestionData) {
          dashboardItems.push({
            type: 'suggestion',
            id: suggestion.id,
            metric_name: suggestionData.metric_name,
            description: suggestionData.metric_description,
            y_axis_label: suggestionData.y_axis_label,
            source_type: suggestion.source_type,
            confidence_score: suggestionData.confidence_score,
            created_at: suggestion.created_at
          })
        }
      }

      return {
        dashboard_items: dashboardItems,
        total_active: activeConfigs?.length || 0,
        total_suggestions: suggestions?.length || 0,
        status: 'success'
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      return {
        dashboard_items: [],
        total_active: 0,
        total_suggestions: 0,
        status: 'error'
      }
    }
  }

  async getChartData(
    configId: string,
    days: number = 30
  ): Promise<ChartData> {
    try {
      // Fetch configuration
      const { data: config, error: configError } = await supabase
        .from('tracking_configurations')
        .select('*')
        .eq('id', configId)
        .single()

      if (configError) throw configError

      // Calculate date range
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Fetch data points
      const { data: dataPoints, error: dataError } = await supabase
        .from('tracking_data_points')
        .select('value, recorded_at, notes')
        .eq('configuration_id', configId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true })

      if (dataError) throw dataError

      // Calculate statistics
      const values = dataPoints?.map(p => p.value) || []
      const statistics = {
        average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0,
        count: values.length
      }

      return {
        config: {
          metric_name: config.metric_name,
          x_axis_label: config.x_axis_label || 'Date',
          y_axis_label: config.y_axis_label,
          y_axis_min: config.y_axis_min,
          y_axis_max: config.y_axis_max,
          chart_type: config.chart_type || 'line',
          color: config.color || '#3B82F6'
        },
        data: dataPoints?.map(point => ({
          x: point.recorded_at,
          y: point.value,
          notes: point.notes
        })) || [],
        statistics
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      throw error
    }
  }

  async addDataPoint(params: {
    configuration_id: string
    user_id: string
    value: number
    notes?: string
    recorded_at?: string
  }): Promise<{ status: string; data_point_id: string }> {
    try {
      const { data, error } = await supabase
        .from('tracking_data_points')
        .insert({
          configuration_id: params.configuration_id,
          user_id: params.user_id,
          value: params.value,
          notes: params.notes,
          recorded_at: params.recorded_at || new Date().toISOString(),
          source_type: 'manual'
        })
        .select()
        .single()

      if (error) throw error

      // Update configuration's last_data_point and data_points_count
      const { error: updateError } = await supabase
        .from('tracking_configurations')
        .update({
          last_data_point: params.recorded_at || new Date().toISOString(),
          data_points_count: supabase.sql`data_points_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.configuration_id)

      if (updateError) throw updateError

      return {
        status: 'success',
        data_point_id: data.id
      }
    } catch (error) {
      console.error('Error adding data point:', error)
      throw error
    }
  }

  async getPastScans(
    userId: string,
    limit: number = 20
  ): Promise<{ past_scans: PastScan[]; total: number; status: string }> {
    try {
      const { data: scans, error, count } = await supabase
        .from('quick_scans')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Check for existing tracking configurations for each scan
      const pastScans: PastScan[] = []
      
      for (const scan of scans || []) {
        const { data: trackingConfig } = await supabase
          .from('tracking_configurations')
          .select('id')
          .eq('source_id', scan.id)
          .eq('source_type', 'quick_scan')
          .single()

        const formData = scan.form_data as any
        const analysisResult = scan.analysis_result as any

        pastScans.push({
          id: scan.id,
          date: scan.created_at,
          body_part: scan.body_part,
          primary_condition: analysisResult?.primary_condition || 'Unknown',
          symptoms: formData?.symptoms ? formData.symptoms.split(',').map((s: string) => s.trim()) : [],
          urgency: scan.urgency_level || 'low',
          has_tracking: !!trackingConfig
        })
      }

      return {
        past_scans: pastScans,
        total: count || 0,
        status: 'success'
      }
    } catch (error) {
      console.error('Error fetching past scans:', error)
      return {
        past_scans: [],
        total: 0,
        status: 'error'
      }
    }
  }

  async getPastDives(
    userId: string,
    limit: number = 20
  ): Promise<{ past_dives: PastScan[]; total: number; status: string }> {
    try {
      const { data: dives, error, count } = await supabase
        .from('deep_dive_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Check for existing tracking configurations for each dive
      const pastDives: PastScan[] = []
      
      for (const dive of dives || []) {
        const { data: trackingConfig } = await supabase
          .from('tracking_configurations')
          .select('id')
          .eq('source_id', dive.id)
          .eq('source_type', 'deep_dive')
          .single()

        const formData = dive.form_data as any
        const finalAnalysis = dive.final_analysis as any

        pastDives.push({
          id: dive.id,
          date: dive.created_at,
          body_part: dive.body_part,
          primary_condition: finalAnalysis?.primary_condition || 'Analysis in progress',
          symptoms: formData?.symptoms ? formData.symptoms.split(',').map((s: string) => s.trim()) : [],
          urgency: finalAnalysis?.urgency_level || 'low',
          has_tracking: !!trackingConfig
        })
      }

      return {
        past_dives: pastDives,
        total: count || 0,
        status: 'success'
      }
    } catch (error) {
      console.error('Error fetching past dives:', error)
      return {
        past_dives: [],
        total: 0,
        status: 'error'
      }
    }
  }

  async updateConfiguration(params: {
    configuration_id: string
    user_id: string
    metric_name: string
    y_axis_label: string
  }): Promise<{ status: string; configuration: TrackingConfiguration }> {
    try {
      const { data, error } = await supabase
        .from('tracking_configurations')
        .update({
          metric_name: params.metric_name,
          y_axis_label: params.y_axis_label,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.configuration_id)
        .eq('user_id', params.user_id)
        .select()
        .single()

      if (error) throw error

      return {
        status: 'success',
        configuration: data
      }
    } catch (error) {
      console.error('Error updating configuration:', error)
      throw error
    }
  }

  async createTrackingConfiguration(params: {
    user_id: string
    source_type: 'quick_scan' | 'deep_dive'
    source_id: string
    metric_name: string
    metric_description?: string
    y_axis_label: string
    y_axis_type?: string
    y_axis_min?: number
    y_axis_max?: number
    tracking_type?: string
    show_on_homepage?: boolean
  }): Promise<{ status: string; configuration_id: string }> {
    try {
      const { data, error } = await supabase
        .from('tracking_configurations')
        .insert({
          user_id: params.user_id,
          source_type: params.source_type,
          source_id: params.source_id,
          metric_name: params.metric_name,
          metric_description: params.metric_description,
          y_axis_label: params.y_axis_label,
          y_axis_type: params.y_axis_type || 'numeric',
          y_axis_min: params.y_axis_min,
          y_axis_max: params.y_axis_max,
          tracking_type: params.tracking_type || 'severity',
          status: 'approved',
          show_on_homepage: params.show_on_homepage !== false,
          approved_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        status: 'success',
        configuration_id: data.id
      }
    } catch (error) {
      console.error('Error creating tracking configuration:', error)
      throw error
    }
  }

  async getSymptomHistory(
    userId: string,
    bodyPart?: string,
    symptomName?: string,
    days: number = 30
  ): Promise<any[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('symptom_tracking')
        .select(`
          *,
          quick_scans!left (
            body_part,
            urgency_level,
            confidence_score,
            analysis_result
          ),
          deep_dive_sessions!left (
            body_part,
            final_confidence,
            final_analysis
          )
        `)
        .eq('user_id', userId)
        .gte('occurrence_date', startDate.toISOString())
        .order('occurrence_date', { ascending: false })

      if (bodyPart) {
        query = query.eq('body_part', bodyPart)
      }

      if (symptomName) {
        query = query.ilike('symptom_name', `%${symptomName}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching symptom history:', error)
      return []
    }
  }

  async createSymptomTracking(params: {
    user_id: string
    quick_scan_id?: string
    deep_dive_id?: string
    symptom_name: string
    body_part: string
    severity?: number
    occurrence_date?: string
  }): Promise<{ status: string; tracking_id: string }> {
    try {
      const { data, error } = await supabase
        .from('symptom_tracking')
        .insert({
          user_id: params.user_id,
          quick_scan_id: params.quick_scan_id,
          deep_dive_id: params.deep_dive_id,
          symptom_name: params.symptom_name,
          body_part: params.body_part,
          severity: params.severity,
          occurrence_date: params.occurrence_date || new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (error) throw error

      return {
        status: 'success',
        tracking_id: data.id
      }
    } catch (error) {
      console.error('Error creating symptom tracking:', error)
      throw error
    }
  }

  async getTrackingInsights(
    userId: string,
    configurationId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('tracking_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (configurationId) {
        query = query.eq('configuration_id', configurationId)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching tracking insights:', error)
      return []
    }
  }
}

export default new SupabaseTrackingService()