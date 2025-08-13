import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiPredictionsApi, aiPredictionCache } from '@/lib/api/aiPredictions';
import { SeasonalPredictionsResponse, SeasonalPrediction } from '@/types/aiPredictions';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';

export function useAISeasonalPredictions() {
  const { user } = useAuth();
  const [data, setData] = useState<SeasonalPredictionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const cacheKey = aiPredictionCache.keys.seasonalPredictions(user.id);
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = aiPredictionCache.get<SeasonalPredictionsResponse>(cacheKey);
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

      // First try Supabase for cached seasonal predictions
      const supabaseResult = await supabaseAIPredictionsService.getPredictionsByType(user.id, 'seasonal');
      
      if (supabaseResult?.predictions && !forceRefresh) {
        const response: SeasonalPredictionsResponse = {
          status: 'success',
          predictions: (supabaseResult.predictions || []).map((p: any) => ({
            ...p,
            type: 'seasonal' as const,
            gradient: p.gradient || 'from-green-600/10 to-emerald-600/10',
            prevention_protocol: p.prevention_protocol || []
          })),
          current_season: supabaseResult.metadata?.current_season,
          next_season_transition: supabaseResult.metadata?.next_season_transition,
          data_quality_score: supabaseResult.data_quality_score || 0
        };
        
        setData(response);
        aiPredictionCache.set(cacheKey, response, 10);
      } else {
        // Fallback to backend API
        const response = await aiPredictionsApi.getSeasonalPredictions(user.id, forceRefresh);
        
        // Ensure predictions have proper type and gradients
        if (response.predictions) {
          response.predictions = response.predictions.map(p => ({
            ...p,
            type: 'seasonal' as const,
            gradient: p.gradient || 'from-green-600/10 to-emerald-600/10',
            prevention_protocol: p.prevention_protocol || []
          }));
        }
        
        setData(response);
        
        // Cache successful responses
        if (response.status === 'success' || response.status === 'cached') {
          aiPredictionCache.set(cacheKey, response, 10); // Cache for 10 minutes
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching seasonal predictions:', err);
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

  // Helper to format season name
  const formatSeason = (season?: string): string => {
    if (!season) return '';
    return season.charAt(0).toUpperCase() + season.slice(1);
  };

  // Helper to format date
  const formatTransitionDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return {
    predictions: data?.predictions || [],
    currentSeason: data?.current_season,
    nextSeasonTransition: data?.next_season_transition,
    dataQualityScore: data?.data_quality_score || 0,
    isLoading,
    isRefreshing,
    error,
    status: data?.status || 'loading',
    formatSeason,
    formatTransitionDate,
    refresh
  };
}