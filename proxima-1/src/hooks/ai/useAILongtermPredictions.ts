import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiPredictionsApi, aiPredictionCache } from '@/lib/api/aiPredictions';
import { LongtermPredictionsResponse, LongtermAssessment } from '@/types/aiPredictions';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';

export function useAILongtermPredictions() {
  const { user } = useAuth();
  const [data, setData] = useState<LongtermPredictionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const cacheKey = aiPredictionCache.keys.longtermPredictions(user.id);
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = aiPredictionCache.get<LongtermPredictionsResponse>(cacheKey);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return;
      }
    }

    try {
      setError(null);
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // First try Supabase for cached longterm predictions
      const supabaseResult = await supabaseAIPredictionsService.getPredictionsByType(user.id, 'longterm');
      
      if (supabaseResult?.predictions && !forceRefresh) {
        // Transform predictions to assessments format
        const response: LongtermPredictionsResponse = {
          status: 'success',
          assessments: (supabaseResult.predictions || []).map((p: any) => ({
            ...p,
            // Ensure proper assessment structure
            trajectory: p.trajectory || {
              current_path: { risk_level: 'moderate', description: '', projected_outcome: '' },
              optimized_path: { description: '', requirements: [] }
            },
            risk_factors: p.risk_factors || [],
            prevention_strategy: p.prevention_strategy || p.prevention_protocol || []
          })),
          overall_health_trajectory: supabaseResult.metadata?.overall_trajectory,
          key_focus_areas: supabaseResult.metadata?.focus_areas || []
        };
        
        setData(response);
        aiPredictionCache.set(cacheKey, response, 15);
      } else {
        // Fallback to backend API
        const response = await aiPredictionsApi.getLongtermPredictions(user.id, forceRefresh);
        setData(response);
        
        // Cache successful responses
        if (response.status === 'success' || response.status === 'cached') {
          aiPredictionCache.set(cacheKey, response, 15); // Cache for 15 minutes
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching long-term predictions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const refresh = useCallback(() => {
    return fetchPredictions(true);
  }, [fetchPredictions]);

  // Helper to get risk level color
  const getRiskLevelColor = (riskLevel: string): string => {
    const colors: Record<string, string> = {
      low: 'text-green-400',
      moderate: 'text-yellow-400',
      high: 'text-red-400'
    };
    return colors[riskLevel] || 'text-gray-400';
  };

  // Helper to get risk level background
  const getRiskLevelBg = (riskLevel: string): string => {
    const backgrounds: Record<string, string> = {
      low: 'bg-green-500/10',
      moderate: 'bg-yellow-500/10',
      high: 'bg-red-500/10'
    };
    return backgrounds[riskLevel] || 'bg-gray-500/10';
  };

  // Helper to format trajectory
  const formatTrajectory = (trajectory?: string): string => {
    if (!trajectory) return '';
    return trajectory.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return {
    assessments: data?.assessments || [],
    overallTrajectory: data?.overall_health_trajectory,
    keyFocusAreas: data?.key_focus_areas || [],
    isLoading,
    isRefreshing,
    error,
    status: data?.status || 'loading',
    getRiskLevelColor,
    getRiskLevelBg,
    formatTrajectory,
    refresh
  };
}