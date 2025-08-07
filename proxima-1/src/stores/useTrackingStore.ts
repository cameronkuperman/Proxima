import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import supabaseTrackingService, { DashboardItem, TrackingSuggestion, ChartData, PastScan } from '@/services/supabaseTrackingService'
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
  updateConfiguration: (params: {
    configuration_id: string
    user_id: string
    metric_name: string
    y_axis_label: string
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
        console.log('[TrackingStore] fetchDashboard called for user:', userId)
        set({ loading: true, error: null })
        try {
          const data = await supabaseTrackingService.getDashboard(userId)
          console.log('[TrackingStore] Dashboard items received:', data.dashboard_items)
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

      // Generate tracking suggestion (simplified for direct Supabase)
      generateSuggestion: async (sourceType: 'quick_scan' | 'deep_dive', sourceId: string, userId: string) => {
        console.log('[TrackingStore] generateSuggestion called:', { sourceType, sourceId, userId })
        
        // Check if we already have a suggestion for this source
        const state = get()
        if (state.currentSuggestion && state.suggestionId) {
          console.log('[TrackingStore] Suggestion already exists, skipping generation')
          return
        }
        
        set({ loading: true, error: null })
        try {
          // Create a default suggestion based on the source type
          const defaultSuggestion = {
            metric_name: `${sourceType === 'quick_scan' ? 'Symptom' : 'Condition'} Severity`,
            metric_description: 'Track severity over time',
            y_axis_label: 'Severity (1-10)',
            y_axis_type: 'numeric' as const,
            y_axis_min: 0,
            y_axis_max: 10,
            tracking_type: 'severity',
            confidence_score: 0.8
          }
          
          set({ 
            currentSuggestion: defaultSuggestion,
            suggestionId: sourceId, // Use sourceId as suggestion ID
            loading: false 
          })
        } catch (error) {
          console.error('[TrackingStore] Error generating suggestion:', error)
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
          const state = get()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user && state.currentSuggestion) {
            // Create tracking configuration directly
            await supabaseTrackingService.createTrackingConfiguration({
              user_id: user.id,
              source_type: 'quick_scan', // Default, should be passed properly
              source_id: suggestionId,
              metric_name: state.currentSuggestion.metric_name,
              metric_description: state.currentSuggestion.metric_description,
              y_axis_label: state.currentSuggestion.y_axis_label,
              y_axis_type: state.currentSuggestion.y_axis_type,
              y_axis_min: state.currentSuggestion.y_axis_min,
              y_axis_max: state.currentSuggestion.y_axis_max,
              tracking_type: state.currentSuggestion.tracking_type,
              show_on_homepage: true
            })
            
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
          // Create tracking configuration with custom params
          await supabaseTrackingService.createTrackingConfiguration({
            user_id: params.user_id,
            source_type: 'quick_scan', // Should be determined from context
            source_id: params.suggestion_id,
            metric_name: params.metric_name,
            y_axis_label: params.y_axis_label,
            show_on_homepage: params.show_on_homepage
          })
          
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

      // Update existing configuration
      updateConfiguration: async (params: {
        configuration_id: string
        user_id: string
        metric_name: string
        y_axis_label: string
      }) => {
        set({ loading: true, error: null })
        try {
          await supabaseTrackingService.updateConfiguration(params)
          
          // Refresh dashboard
          await get().fetchDashboard(params.user_id)
          
          set({ loading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update configuration',
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
            await supabaseTrackingService.addDataPoint({
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
          const chartData = await supabaseTrackingService.getChartData(configId, days)
          console.log('Chart data from Supabase:', chartData)
          
          // Update chart data map
          const newChartData = new Map(get().chartData)
          newChartData.set(configId, chartData)
          
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
          const data = await supabaseTrackingService.getPastScans(userId)
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
          const data = await supabaseTrackingService.getPastDives(userId)
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