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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app'

class TrackingService {
  private async fetchWithAuth(url: string, options?: RequestInit) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      const data = await response.json()

      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('Tracking API Error:', error)
      throw error
    }
  }

  async generateTrackingSuggestion(
    sourceType: 'quick_scan' | 'deep_dive',
    sourceId: string,
    userId: string
  ): Promise<TrackingSuggestion> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/suggest`, {
      method: 'POST',
      body: JSON.stringify({
        source_type: sourceType,
        source_id: sourceId,
        user_id: userId,
      }),
    })
  }

  async approveSuggestion(suggestionId: string): Promise<{ status: string; configuration_id: string }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/approve/${suggestionId}`, {
      method: 'POST',
    })
  }

  async configureSuggestion(params: {
    suggestion_id: string
    user_id: string
    metric_name: string
    y_axis_label: string
    show_on_homepage?: boolean
  }): Promise<{ status: string; configuration: TrackingConfiguration }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/configure`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateConfiguration(params: {
    configuration_id: string
    user_id: string
    metric_name: string
    y_axis_label: string
  }): Promise<{ status: string; configuration: TrackingConfiguration }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/configurations/${params.configuration_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        metric_name: params.metric_name,
        y_axis_label: params.y_axis_label
      }),
    })
  }

  async addDataPoint(params: {
    configuration_id: string
    user_id: string
    value: number
    notes?: string
    recorded_at?: string
  }): Promise<{ status: string; data_point_id: string }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/data`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getDashboard(userId: string): Promise<{
    dashboard_items: DashboardItem[]
    total_active: number
    total_suggestions: number
    status: string
  }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/dashboard?user_id=${userId}`)
  }

  async getChartData(
    configId: string,
    days: number = 30
  ): Promise<{ chart_data: ChartData; status: string }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/chart/${configId}?days=${days}`)
  }

  async getDataPoints(
    configId: string,
    days: number = 30
  ): Promise<any> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/data-points/${configId}?days=${days}`)
  }

  async getPastScans(
    userId: string,
    limit: number = 20
  ): Promise<{ past_scans: PastScan[]; total: number; status: string }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/past-scans?user_id=${userId}&limit=${limit}`)
  }

  async getPastDives(
    userId: string,
    limit: number = 20
  ): Promise<{ past_dives: PastScan[]; total: number; status: string }> {
    return this.fetchWithAuth(`${API_URL}/api/tracking/past-dives?user_id=${userId}&limit=${limit}`)
  }
}

export default new TrackingService()