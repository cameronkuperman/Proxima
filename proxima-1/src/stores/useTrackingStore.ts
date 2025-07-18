import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import trackingService, { DashboardItem, TrackingSuggestion, ChartData, PastScan } from '@/services/trackingService'
import { supabase } from '@/lib/supabase'

interface TrackingStore {
  // State
  dashboardItems: DashboardItem[]
  activeConfigs: Map<string, any>
  currentSuggestion: TrackingSuggestion['suggestion'] | null
  suggestionId: string | null
  chartData: Map<string, ChartData>
  pastScans: PastScan[]
  pastDives: PastScan[]
  loading: boolean
  error: string | null

  // Actions
  fetchDashboard: (userId: string) => Promise<void>
  generateSuggestion: (sourceType: 'quick_scan' | 'deep_dive', sourceId: string, userId: string) => Promise<void>
  approveSuggestion: (suggestionId: string) => Promise<void>
  configureSuggestion: (params: {
    suggestion_id: string
    user_id: string
    metric_name: string
    y_axis_label: string
    show_on_homepage?: boolean
  }) => Promise<void>
  logDataPoint: (configId: string, value: number, notes?: string) => Promise<void>
  fetchChartData: (configId: string, days?: number) => Promise<void>
  fetchPastScans: (userId: string) => Promise<void>
  fetchPastDives: (userId: string) => Promise<void>
  clearError: () => void
  clearSuggestion: () => void
}

export const useTrackingStore = create<TrackingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      dashboardItems: [],
      activeConfigs: new Map(),
      currentSuggestion: null,
      suggestionId: null,
      chartData: new Map(),
      pastScans: [],
      pastDives: [],
      loading: false,
      error: null,

      // Fetch dashboard data
      fetchDashboard: async (userId: string) => {
        set({ loading: true, error: null })
        try {
          const data = await trackingService.getDashboard(userId)
          set({ 
            dashboardItems: data.dashboard_items,
            loading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch dashboard',
            loading: false 
          })
        }
      },

      // Generate tracking suggestion
      generateSuggestion: async (sourceType: 'quick_scan' | 'deep_dive', sourceId: string, userId: string) => {
        set({ loading: true, error: null })
        try {
          const data = await trackingService.generateTrackingSuggestion(sourceType, sourceId, userId)
          if (data.status === 'success') {
            set({ 
              currentSuggestion: data.suggestion,
              suggestionId: data.suggestion_id,
              loading: false 
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate suggestion',
            loading: false 
          })
        }
      },

      // Approve suggestion without changes
      approveSuggestion: async (suggestionId: string) => {
        set({ loading: true, error: null })
        try {
          await trackingService.approveSuggestion(suggestionId)
          
          // Get current user ID
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Refresh dashboard
            await get().fetchDashboard(user.id)
          }
          
          set({ 
            currentSuggestion: null,
            suggestionId: null,
            loading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to approve suggestion',
            loading: false 
          })
        }
      },

      // Configure and approve suggestion
      configureSuggestion: async (params) => {
        set({ loading: true, error: null })
        try {
          await trackingService.configureSuggestion(params)
          
          // Refresh dashboard
          await get().fetchDashboard(params.user_id)
          
          set({ 
            currentSuggestion: null,
            suggestionId: null,
            loading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to configure suggestion',
            loading: false 
          })
        }
      },

      // Log a data point
      logDataPoint: async (configId: string, value: number, notes?: string) => {
        set({ loading: true, error: null })
        try {
          // Get current user ID
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            await trackingService.addDataPoint({
              configuration_id: configId,
              user_id: user.id,
              value,
              notes,
              recorded_at: new Date().toISOString()
            })
            
            // Refresh dashboard to update latest values
            await get().fetchDashboard(user.id)
          }
          
          set({ loading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to log data point',
            loading: false 
          })
        }
      },

      // Fetch chart data
      fetchChartData: async (configId: string, days: number = 30) => {
        set({ loading: true, error: null })
        try {
          const data = await trackingService.getChartData(configId, days)
          console.log('Chart API response:', data)
          
          // Update chart data map
          const newChartData = new Map(get().chartData)
          newChartData.set(configId, data.chart_data)
          
          set({ 
            chartData: newChartData,
            loading: false 
          })
        } catch (error) {
          console.error('Chart data fetch error:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch chart data',
            loading: false 
          })
        }
      },

      // Fetch past scans
      fetchPastScans: async (userId: string) => {
        set({ loading: true, error: null })
        try {
          const data = await trackingService.getPastScans(userId)
          set({ 
            pastScans: data.past_scans,
            loading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch past scans',
            loading: false 
          })
        }
      },

      // Fetch past dives
      fetchPastDives: async (userId: string) => {
        set({ loading: true, error: null })
        try {
          const data = await trackingService.getPastDives(userId)
          set({ 
            pastDives: data.past_dives,
            loading: false 
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch past dives',
            loading: false 
          })
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear current suggestion
      clearSuggestion: () => set({ currentSuggestion: null, suggestionId: null })
    }),
    {
      name: 'tracking-store'
    }
  )
)