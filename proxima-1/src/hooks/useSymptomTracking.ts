import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import supabaseSymptomService, { SymptomData, SymptomTrend, SymptomSummary } from '@/services/supabaseSymptomService'
import supabaseTrackingService from '@/services/supabaseTrackingService'

export function useSymptomTracking() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [symptomHistory, setSymptomHistory] = useState<SymptomData[]>([])
  const [symptomTrends, setSymptomTrends] = useState<SymptomTrend[]>([])
  const [symptomSummary, setSymptomSummary] = useState<SymptomSummary | null>(null)

  // Track symptoms from a quick scan
  const trackFromQuickScan = useCallback(async (quickScanId: string) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      await supabaseSymptomService.trackFromQuickScan(quickScanId, user.id)
      
      // Optionally create a tracking configuration
      await supabaseTrackingService.createTrackingConfiguration({
        user_id: user.id,
        source_type: 'quick_scan',
        source_id: quickScanId,
        metric_name: 'Symptom Severity',
        metric_description: 'Track symptom severity over time',
        y_axis_label: 'Severity (1-10)',
        y_axis_type: 'numeric',
        y_axis_min: 0,
        y_axis_max: 10,
        tracking_type: 'severity',
        show_on_homepage: true
      })
      
      // Refresh data
      await fetchSymptomHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track symptoms')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Track symptoms from a deep dive
  const trackFromDeepDive = useCallback(async (deepDiveId: string) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      await supabaseSymptomService.trackFromDeepDive(deepDiveId, user.id)
      
      // Optionally create a tracking configuration
      await supabaseTrackingService.createTrackingConfiguration({
        user_id: user.id,
        source_type: 'deep_dive',
        source_id: deepDiveId,
        metric_name: 'Condition Progress',
        metric_description: 'Track condition progress over time',
        y_axis_label: 'Severity (1-10)',
        y_axis_type: 'numeric',
        y_axis_min: 0,
        y_axis_max: 10,
        tracking_type: 'severity',
        show_on_homepage: true
      })
      
      // Refresh data
      await fetchSymptomHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track symptoms')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch symptom history
  const fetchSymptomHistory = useCallback(async (options?: {
    symptomName?: string
    bodyPart?: string
    days?: number
    limit?: number
  }) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const history = await supabaseSymptomService.getSymptomHistory(user.id, options)
      setSymptomHistory(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch symptom history')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch symptom trends
  const fetchSymptomTrends = useCallback(async (days: number = 30) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const trends = await supabaseSymptomService.getSymptomTrends(user.id, days)
      setSymptomTrends(trends)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch symptom trends')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch symptom summary
  const fetchSymptomSummary = useCallback(async (days: number = 7) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const summary = await supabaseSymptomService.getSymptomSummary(user.id, days)
      setSymptomSummary(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch symptom summary')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Search symptoms
  const searchSymptoms = useCallback(async (searchTerm: string, days: number = 90) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const results = await supabaseSymptomService.searchSymptoms(user.id, searchTerm, days)
      setSymptomHistory(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search symptoms')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Get symptoms by body part
  const getSymptomsByBodyPart = useCallback(async (bodyPart: string, days: number = 30) => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const symptoms = await supabaseSymptomService.getSymptomsByBodyPart(user.id, bodyPart, days)
      setSymptomHistory(symptoms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch symptoms by body part')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Auto-fetch summary on mount
  useEffect(() => {
    if (user?.id) {
      fetchSymptomSummary()
    }
  }, [user?.id, fetchSymptomSummary])

  return {
    // State
    loading,
    error,
    symptomHistory,
    symptomTrends,
    symptomSummary,
    
    // Actions
    trackFromQuickScan,
    trackFromDeepDive,
    fetchSymptomHistory,
    fetchSymptomTrends,
    fetchSymptomSummary,
    searchSymptoms,
    getSymptomsByBodyPart,
    clearError: () => setError(null)
  }
}