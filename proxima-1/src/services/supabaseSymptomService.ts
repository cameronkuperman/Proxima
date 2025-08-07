import { supabase } from '@/lib/supabase'

export interface SymptomData {
  id: string
  user_id: string
  symptom_name: string
  body_part: string
  severity?: number
  occurrence_date: string
  source: 'quick_scan' | 'deep_dive' | 'manual'
  source_id?: string
  urgency_level?: string
  confidence_score?: number
  analysis_summary?: string
}

export interface SymptomTrend {
  symptom_name: string
  body_part: string
  data_points: Array<{
    date: string
    severity: number
    source: string
  }>
  trend: 'improving' | 'worsening' | 'stable'
  average_severity: number
  occurrences: number
}

export interface SymptomSummary {
  total_symptoms: number
  unique_symptoms: number
  most_frequent: string[]
  most_severe: string[]
  body_parts_affected: string[]
  recent_changes: Array<{
    symptom: string
    change: 'new' | 'worsening' | 'improving'
    date: string
  }>
}

class SupabaseSymptomService {
  /**
   * Extract and track symptoms from a quick scan
   */
  async trackFromQuickScan(quickScanId: string, userId: string): Promise<void> {
    try {
      // Fetch the quick scan data
      const { data: scan, error } = await supabase
        .from('quick_scans')
        .select('*')
        .eq('id', quickScanId)
        .single()

      if (error || !scan) throw error || new Error('Quick scan not found')

      const formData = scan.form_data as any
      const analysisResult = scan.analysis_result as any
      
      // Parse symptoms from form data
      const symptoms = formData?.symptoms ? 
        formData.symptoms.split(',').map((s: string) => s.trim()) : []
      
      // Create symptom tracking entries
      for (const symptom of symptoms) {
        await this.createSymptomEntry({
          user_id: userId,
          quick_scan_id: quickScanId,
          symptom_name: symptom,
          body_part: scan.body_part,
          severity: formData?.painLevel || 5,
          occurrence_date: new Date().toISOString().split('T')[0]
        })
      }

      // Also track primary condition if identified
      if (analysisResult?.primary_condition) {
        await this.createSymptomEntry({
          user_id: userId,
          quick_scan_id: quickScanId,
          symptom_name: analysisResult.primary_condition,
          body_part: scan.body_part,
          severity: scan.confidence_score ? Math.round(scan.confidence_score / 10) : 5,
          occurrence_date: new Date().toISOString().split('T')[0]
        })
      }
    } catch (error) {
      console.error('Error tracking symptoms from quick scan:', error)
    }
  }

  /**
   * Extract and track symptoms from a deep dive session
   */
  async trackFromDeepDive(deepDiveId: string, userId: string): Promise<void> {
    try {
      // Fetch the deep dive data
      const { data: dive, error } = await supabase
        .from('deep_dive_sessions')
        .select('*')
        .eq('id', deepDiveId)
        .single()

      if (error || !dive) throw error || new Error('Deep dive not found')

      const formData = dive.form_data as any
      const finalAnalysis = dive.final_analysis as any
      
      // Parse symptoms from form data
      const symptoms = formData?.symptoms ? 
        formData.symptoms.split(',').map((s: string) => s.trim()) : []
      
      // Create symptom tracking entries
      for (const symptom of symptoms) {
        await this.createSymptomEntry({
          user_id: userId,
          deep_dive_id: deepDiveId,
          symptom_name: symptom,
          body_part: dive.body_part,
          severity: formData?.painLevel || 5,
          occurrence_date: new Date().toISOString().split('T')[0]
        })
      }

      // Track conditions identified in analysis
      if (finalAnalysis?.conditions) {
        for (const condition of finalAnalysis.conditions) {
          await this.createSymptomEntry({
            user_id: userId,
            deep_dive_id: deepDiveId,
            symptom_name: condition.name || condition,
            body_part: dive.body_part,
            severity: condition.severity || dive.final_confidence ? Math.round(dive.final_confidence / 10) : 5,
            occurrence_date: new Date().toISOString().split('T')[0]
          })
        }
      }
    } catch (error) {
      console.error('Error tracking symptoms from deep dive:', error)
    }
  }

  /**
   * Create a symptom tracking entry
   */
  private async createSymptomEntry(params: {
    user_id: string
    quick_scan_id?: string
    deep_dive_id?: string
    symptom_name: string
    body_part: string
    severity?: number
    occurrence_date?: string
  }): Promise<void> {
    try {
      // Check if this symptom was already tracked today
      const { data: existing } = await supabase
        .from('symptom_tracking')
        .select('id')
        .eq('user_id', params.user_id)
        .eq('symptom_name', params.symptom_name)
        .eq('body_part', params.body_part)
        .eq('occurrence_date', params.occurrence_date || new Date().toISOString().split('T')[0])
        .single()

      if (existing) {
        // Update severity if higher
        if (params.severity) {
          await supabase
            .from('symptom_tracking')
            .update({ severity: params.severity })
            .eq('id', existing.id)
            .gte('severity', params.severity)
        }
        return
      }

      // Create new entry
      await supabase
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
    } catch (error) {
      console.error('Error creating symptom entry:', error)
    }
  }

  /**
   * Get symptom history for a user
   */
  async getSymptomHistory(
    userId: string,
    options?: {
      symptomName?: string
      bodyPart?: string
      days?: number
      limit?: number
    }
  ): Promise<SymptomData[]> {
    try {
      const days = options?.days || 30
      const limit = options?.limit || 100
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('symptom_tracking')
        .select(`
          *,
          quick_scans!left (
            urgency_level,
            confidence_score,
            analysis_result,
            llm_summary
          ),
          deep_dive_sessions!left (
            final_confidence,
            final_analysis,
            llm_summary
          )
        `)
        .eq('user_id', userId)
        .gte('occurrence_date', startDate.toISOString())
        .order('occurrence_date', { ascending: false })
        .limit(limit)

      if (options?.symptomName) {
        query = query.ilike('symptom_name', `%${options.symptomName}%`)
      }

      if (options?.bodyPart) {
        query = query.eq('body_part', options.bodyPart)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data
      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        symptom_name: item.symptom_name,
        body_part: item.body_part,
        severity: item.severity,
        occurrence_date: item.occurrence_date,
        source: item.quick_scan_id ? 'quick_scan' : item.deep_dive_id ? 'deep_dive' : 'manual',
        source_id: item.quick_scan_id || item.deep_dive_id,
        urgency_level: item.quick_scans?.urgency_level,
        confidence_score: item.quick_scans?.confidence_score || item.deep_dive_sessions?.final_confidence,
        analysis_summary: item.quick_scans?.llm_summary || item.deep_dive_sessions?.llm_summary
      }))
    } catch (error) {
      console.error('Error fetching symptom history:', error)
      return []
    }
  }

  /**
   * Get symptom trends over time
   */
  async getSymptomTrends(
    userId: string,
    days: number = 30
  ): Promise<SymptomTrend[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('symptom_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('occurrence_date', startDate.toISOString())
        .order('occurrence_date', { ascending: true })

      if (error) throw error

      // Group by symptom and body part
      const trends = new Map<string, SymptomTrend>()
      
      for (const item of data || []) {
        const key = `${item.symptom_name}-${item.body_part}`
        
        if (!trends.has(key)) {
          trends.set(key, {
            symptom_name: item.symptom_name,
            body_part: item.body_part,
            data_points: [],
            trend: 'stable',
            average_severity: 0,
            occurrences: 0
          })
        }

        const trend = trends.get(key)!
        trend.data_points.push({
          date: item.occurrence_date,
          severity: item.severity || 5,
          source: item.quick_scan_id ? 'quick_scan' : item.deep_dive_id ? 'deep_dive' : 'manual'
        })
        trend.occurrences++
      }

      // Calculate trends and averages
      const results: SymptomTrend[] = []
      
      for (const trend of trends.values()) {
        const severities = trend.data_points.map(p => p.severity)
        trend.average_severity = severities.reduce((a, b) => a + b, 0) / severities.length

        // Determine trend (compare first third vs last third)
        if (severities.length >= 3) {
          const third = Math.floor(severities.length / 3)
          const firstThirdAvg = severities.slice(0, third).reduce((a, b) => a + b, 0) / third
          const lastThirdAvg = severities.slice(-third).reduce((a, b) => a + b, 0) / third
          
          if (lastThirdAvg > firstThirdAvg + 0.5) trend.trend = 'worsening'
          else if (lastThirdAvg < firstThirdAvg - 0.5) trend.trend = 'improving'
        }

        results.push(trend)
      }

      // Sort by occurrences (most frequent first)
      return results.sort((a, b) => b.occurrences - a.occurrences)
    } catch (error) {
      console.error('Error fetching symptom trends:', error)
      return []
    }
  }

  /**
   * Get symptom summary for dashboard
   */
  async getSymptomSummary(
    userId: string,
    days: number = 7
  ): Promise<SymptomSummary> {
    try {
      const history = await this.getSymptomHistory(userId, { days })
      const trends = await this.getSymptomTrends(userId, days)

      // Calculate summary statistics
      const uniqueSymptoms = new Set(history.map(h => h.symptom_name))
      const bodyParts = new Set(history.map(h => h.body_part))
      
      // Most frequent symptoms
      const frequency = new Map<string, number>()
      history.forEach(h => {
        frequency.set(h.symptom_name, (frequency.get(h.symptom_name) || 0) + 1)
      })
      const mostFrequent = Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom]) => symptom)

      // Most severe symptoms
      const severityMap = new Map<string, number[]>()
      history.forEach(h => {
        if (h.severity) {
          const severities = severityMap.get(h.symptom_name) || []
          severities.push(h.severity)
          severityMap.set(h.symptom_name, severities)
        }
      })
      const mostSevere = Array.from(severityMap.entries())
        .map(([symptom, severities]) => ({
          symptom,
          avgSeverity: severities.reduce((a, b) => a + b, 0) / severities.length
        }))
        .sort((a, b) => b.avgSeverity - a.avgSeverity)
        .slice(0, 3)
        .map(item => item.symptom)

      // Recent changes
      const recentChanges: SymptomSummary['recent_changes'] = []
      
      // Check for new symptoms (appeared in last 2 days but not before)
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      
      const recentSymptoms = history
        .filter(h => new Date(h.occurrence_date) >= twoDaysAgo)
        .map(h => h.symptom_name)
      
      const olderSymptoms = history
        .filter(h => new Date(h.occurrence_date) < twoDaysAgo)
        .map(h => h.symptom_name)
      
      const newSymptoms = [...new Set(recentSymptoms.filter(s => !olderSymptoms.includes(s)))]
      
      newSymptoms.forEach(symptom => {
        recentChanges.push({
          symptom,
          change: 'new',
          date: new Date().toISOString().split('T')[0]
        })
      })

      // Check trends for worsening/improving
      trends.forEach(trend => {
        if (trend.trend === 'worsening' && trend.data_points.length >= 3) {
          recentChanges.push({
            symptom: trend.symptom_name,
            change: 'worsening',
            date: trend.data_points[trend.data_points.length - 1].date
          })
        } else if (trend.trend === 'improving' && trend.data_points.length >= 3) {
          recentChanges.push({
            symptom: trend.symptom_name,
            change: 'improving',
            date: trend.data_points[trend.data_points.length - 1].date
          })
        }
      })

      return {
        total_symptoms: history.length,
        unique_symptoms: uniqueSymptoms.size,
        most_frequent: mostFrequent,
        most_severe: mostSevere,
        body_parts_affected: Array.from(bodyParts),
        recent_changes: recentChanges.slice(0, 5)
      }
    } catch (error) {
      console.error('Error getting symptom summary:', error)
      return {
        total_symptoms: 0,
        unique_symptoms: 0,
        most_frequent: [],
        most_severe: [],
        body_parts_affected: [],
        recent_changes: []
      }
    }
  }

  /**
   * Get symptoms by body part
   */
  async getSymptomsByBodyPart(
    userId: string,
    bodyPart: string,
    days: number = 30
  ): Promise<SymptomData[]> {
    return this.getSymptomHistory(userId, { bodyPart, days })
  }

  /**
   * Search symptoms
   */
  async searchSymptoms(
    userId: string,
    searchTerm: string,
    days: number = 90
  ): Promise<SymptomData[]> {
    return this.getSymptomHistory(userId, { symptomName: searchTerm, days })
  }
}

export default new SupabaseSymptomService()