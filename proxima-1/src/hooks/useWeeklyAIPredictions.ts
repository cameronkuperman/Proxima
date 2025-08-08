import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';

interface WeeklyPredictions {
  id: string;
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
  };
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
    // Legacy fields for backwards compatibility
    severity?: 'info' | 'warning' | 'alert';
    description?: string;
    preventionProtocols?: string[];
    category?: string;
    reasoning?: string;
    dataPoints?: string[];
    // Seasonal/longterm specific
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
    // Legacy fields
    answer?: string;
    deepDive?: string[];
    connections?: string[];
    relevanceScore?: number;
    basedOn?: string[];
  }>;
  body_patterns: {
    tendencies: string[];
    positive_responses: string[];
    // Legacy field
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

export function useWeeklyAIPredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<WeeklyPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'success' | 'needs_initial' | 'not_found'>('success');

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    fetchPredictions();
  }, [user?.id]);

  const fetchPredictions = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // First try to fetch from Supabase (faster)
      const supabaseResult = await supabaseAIPredictionsService.getCurrentPredictions(user.id);
      
      if (supabaseResult.status === 'success' && supabaseResult.predictions) {
        setPredictions(supabaseResult.predictions as WeeklyPredictions);
        setStatus('success');
      } else if (supabaseResult.status === 'needs_initial') {
        // No predictions exist, generate initial ones
        setStatus('needs_initial');
        await generateInitialPredictions();
      } else {
        // Try backend API as fallback
        const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
        const response = await fetch(
          `${API_URL}/api/ai/weekly/${user.id}`
        );
        
        const data = await response.json();
        setStatus(data.status);
        
        if (data.status === 'success' && data.predictions) {
          setPredictions(data.predictions);
        } else if (data.status === 'needs_initial' || data.status === 'not_found') {
          // Automatically generate initial predictions
          await generateInitialPredictions();
        }
      }
    } catch (error) {
      console.error('Error fetching weekly predictions:', error);
      setStatus('not_found');
      // Try to generate if fetch fails
      await generateInitialPredictions();
    } finally {
      setIsLoading(false);
    }
  };

  const generateInitialPredictions = async () => {
    if (!user?.id || isGenerating) return;
    
    try {
      setIsGenerating(true);
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const response = await fetch(
        `${API_URL}/api/ai/generate-initial/${user.id}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Wait a moment for generation to complete
          await new Promise(resolve => setTimeout(resolve, 3000));
          // Fetch the newly generated predictions
          await fetchPredictions();
        }
      }
    } catch (error) {
      console.error('Error generating initial predictions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const regeneratePredictions = async () => {
    if (!user?.id || isGenerating) return;
    
    try {
      setIsGenerating(true);
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const response = await fetch(
        `${API_URL}/api/ai/regenerate/${user.id}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Wait for regeneration
        await new Promise(resolve => setTimeout(resolve, 3000));
        await fetchPredictions();
        return { success: true };
      } else if (data.status === 'rate_limited') {
        return { success: false, message: data.message };
      }
      
      return { success: false, message: 'Failed to regenerate predictions' };
    } catch (error) {
      console.error('Error regenerating predictions:', error);
      return { success: false, message: 'An error occurred' };
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract individual components for backward compatibility
  const dashboardAlert = predictions?.dashboard_alert || null;
  const allPredictions = predictions?.predictions || [];
  const patternQuestions = predictions?.pattern_questions || [];
  const bodyPatterns = predictions?.body_patterns || null;
  const dataQualityScore = predictions?.data_quality_score || 0;

  return {
    // Full predictions object
    predictions,
    
    // Individual components
    dashboardAlert,
    allPredictions,
    patternQuestions,
    bodyPatterns,
    dataQualityScore,
    
    // Status
    isLoading,
    isGenerating,
    status,
    
    // Actions
    regeneratePredictions,
    refreshPredictions: fetchPredictions
  };
}