import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  healthIntelligenceService,
  HealthInsight,
  ShadowPattern,
  StrategicMove,
  HealthScore
} from '@/services/supabaseHealthIntelligenceService';

// Keep existing interfaces for backward compatibility
interface HealthPrediction {
  id: string;
  user_id: string;
  story_id?: string | null;
  event_description: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  reasoning?: string;
  suggested_actions?: string[];
  week_of: string;
  created_at: string;
}

interface GenerationStatus {
  insights: boolean;
  predictions: boolean;
  shadow_patterns: boolean;
  strategies: boolean;
  last_generated: string | null;
  refresh_limits?: {
    refreshes_used: number;
    refreshes_remaining: number;
    weekly_limit: number;
    resets_at: string;
  };
}

interface CacheInfo {
  insights?: string;
  predictions?: string;
  shadowPatterns?: string;
  strategies?: string;
}

export function useHealthIntelligence() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [shadowPatterns, setShadowPatterns] = useState<ShadowPattern[]>([]);
  const [strategies, setStrategies] = useState<StrategicMove[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [generatingShadowPatterns, setGeneratingShadowPatterns] = useState(false);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  const [weekOf, setWeekOf] = useState('');
  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [patternsError, setPatternsError] = useState<string | null>(null);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);
  
  // Initialize with default values
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    insights: false,
    predictions: false,
    shadow_patterns: false,
    strategies: false,
    last_generated: null
  });
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({});
  const [groupedShadowPatterns, setGroupedShadowPatterns] = useState<Record<string, ShadowPattern[]>>({});

  // Load data from Supabase
  const loadHealthIntelligence = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Loading Health Intelligence from Supabase...');
    console.log('User ID:', user.id);
    
    try {
      // Fetch all data from Supabase
      const data = await healthIntelligenceService.fetchAllWeeklyIntelligence(user.id);
      
      console.log('📊 Loaded Intelligence Data:', {
        weekOf: data.weekOf,
        isCurrentWeek: data.isCurrentWeek,
        insightsCount: data.insights.length,
        shadowPatternsCount: data.shadowPatterns.length,
        strategiesCount: data.strategicMoves.length,
        hasHealthScore: !!data.healthScore
      });
      
      // Set the data
      setInsights(data.insights);
      setShadowPatterns(data.shadowPatterns);
      setStrategies(data.strategicMoves);
      setHealthScore(data.healthScore);
      setWeekOf(data.weekOf);
      setIsCurrentWeek(data.isCurrentWeek);
      
      // Group shadow patterns by category
      const grouped = data.shadowPatterns.reduce((acc, pattern) => {
        const category = pattern.pattern_category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(pattern);
        return acc;
      }, {} as Record<string, ShadowPattern[]>);
      setGroupedShadowPatterns(grouped);
      
      // Set generation status based on data availability
      setGenerationStatus({
        insights: data.insights.length > 0,
        predictions: false, // Not using predictions from this table
        shadow_patterns: data.shadowPatterns.length > 0,
        strategies: data.strategicMoves.length > 0,
        last_generated: data.weekOf
      });
      
      // Set cache info
      setCacheInfo({
        insights: data.weekOf,
        shadowPatterns: data.weekOf,
        strategies: data.weekOf
      });
      
      // If showing previous week's data, show a notification
      if (!data.isCurrentWeek && data.previousWeekAvailable) {
        setError(`Showing data from previous week (${data.weekOf}). Current week's data is being generated.`);
      }
      
      // Check for individual table errors
      if (data.insights.length === 0) {
        setInsightsError('No insights available for this period');
      }
      if (data.shadowPatterns.length === 0) {
        setPatternsError('No patterns detected for this period');
      }
      if (data.strategicMoves.length === 0) {
        setStrategiesError('No strategies available for this period');
      }
      
    } catch (error) {
      console.error('❌ Error loading health intelligence:', error);
      setError('Failed to load health intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load data on mount
  useEffect(() => {
    loadHealthIntelligence();
  }, [loadHealthIntelligence]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadHealthIntelligence();
  }, [loadHealthIntelligence]);

  // Update strategy status
  const updateStrategyStatus = useCallback(async (
    strategyId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) => {
    const success = await healthIntelligenceService.updateStrategicMoveStatus(strategyId, status);
    if (success) {
      // Update local state
      setStrategies(prev => prev.map(s => 
        s.id === strategyId ? { ...s, completion_status: status } : s
      ));
    }
    return success;
  }, []);

  // Stub functions for backward compatibility (not calling backend anymore)
  const regenerateAll = useCallback(async (forceRefresh = false) => {
    console.log('⚠️ Regenerate is handled by backend scheduler, refreshing data instead...');
    await refresh();
  }, [refresh]);

  const regenerateComponent = useCallback(async (
    component: 'insights' | 'predictions' | 'shadow-patterns' | 'strategies',
    forceRefresh = false
  ) => {
    console.log(`⚠️ ${component} generation is handled by backend scheduler, refreshing data instead...`);
    await refresh();
  }, [refresh]);

  const generateWeeklyAnalysis = useCallback(async (options?: { forceRefresh?: boolean }) => {
    console.log('⚠️ Weekly analysis is generated by backend scheduler, refreshing data instead...');
    await refresh();
  }, [refresh]);

  const generateInsights = useCallback(async (forceRefresh = false) => {
    console.log('⚠️ Insights are generated by backend scheduler, refreshing data instead...');
    await refresh();
  }, [refresh]);

  const generateShadowPatterns = useCallback(async (forceRefresh = false) => {
    console.log('⚠️ Shadow patterns are generated by backend scheduler, refreshing data instead...');
    await refresh();
  }, [refresh]);

  return {
    // Data
    insights,
    predictions, // Keep empty for now
    shadowPatterns,
    strategies,
    healthScore,
    
    // Loading states
    isLoading,
    isGenerating,
    generatingInsights,
    generatingPredictions,
    generatingShadowPatterns,
    generatingStrategies,
    
    // Metadata
    weekOf,
    isCurrentWeek,
    error,
    insightsError,
    predictionsError,
    patternsError,
    strategiesError,
    generationStatus,
    cacheInfo,
    groupedShadowPatterns,
    
    // Actions
    refresh,
    regenerateAll,
    regenerateComponent,
    generateWeeklyAnalysis,
    generateInsights,
    generateShadowPatterns,
    updateStrategyStatus
  };
}

// Export hooks for specific components (for backward compatibility)
export function useHealthAnalysis() {
  const intelligence = useHealthIntelligence();
  return {
    data: {
      insights: intelligence.insights,
      predictions: intelligence.predictions,
      shadow_patterns: intelligence.shadowPatterns,
      strategies: intelligence.strategies
    },
    isLoading: intelligence.isLoading,
    error: intelligence.error
  };
}

export function useExportPDF() {
  return {
    exportPDF: async () => {
      console.log('PDF export not implemented');
      return null;
    },
    isExporting: false
  };
}

export function useShareWithDoctor() {
  return {
    share: async () => {
      console.log('Share with doctor not implemented');
      return null;
    },
    isSharing: false
  };
}