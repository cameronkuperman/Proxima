import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiPredictionsApi, aiPredictionCache } from '@/lib/api/aiPredictions';
import { PredictionsResponse, ImmediatePrediction } from '@/types/aiPredictions';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';

export function useAIImmediatePredictions() {
  const { user } = useAuth();
  const [data, setData] = useState<PredictionsResponse<ImmediatePrediction> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const cacheKey = aiPredictionCache.keys.immediatePredictions(user.id);
    
    // Layer 1: Check memory cache first unless force refresh
    if (!forceRefresh) {
      const cached = aiPredictionCache.get<PredictionsResponse<ImmediatePrediction>>(cacheKey);
      if (cached) {
        console.log('Using memory cached predictions');
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

      // Layer 2: Try Supabase (database cache)
      const supabaseResult = await supabaseAIPredictionsService.getImmediatePredictionsOnly(user.id);
      
      // Check cache validity and status
      const shouldUseSupabaseData = 
        (supabaseResult.status === 'success' || supabaseResult.status === 'expired') && 
        supabaseResult.predictions && 
        supabaseResult.predictions.length > 0;
      
      const shouldCallBackend = 
        forceRefresh || 
        supabaseResult.status === 'needs_backend' ||
        (supabaseResult.status === 'expired' && !supabaseResult.predictions?.length) ||
        (!shouldUseSupabaseData && supabaseResult.status !== 'needs_data');

      if (shouldUseSupabaseData) {
        // Format the response to match expected structure
        const formattedResponse: PredictionsResponse<ImmediatePrediction> = {
          status: supabaseResult.cache_valid === false ? 'cached' : 'success',
          predictions: (supabaseResult.predictions || []).map(p => ({
            ...p,
            type: 'immediate' as const,
            prevention_protocol: p.prevention_protocol || p.preventionProtocols || [],
            subtitle: p.subtitle || p.description,
            gradient: p.gradient || getDefaultGradient(p.severity || 'info')
          })),
          data_quality_score: supabaseResult.data_quality_score || 0
        };
        
        setData(formattedResponse);
        
        // Cache the response in memory (shorter TTL for expired data)
        const cacheTTL = supabaseResult.cache_valid === false ? 2 : 5;
        aiPredictionCache.set(cacheKey, formattedResponse, cacheTTL);
        
        // If cache is expired but we have data, trigger background refresh
        if (supabaseResult.status === 'expired' && !forceRefresh) {
          console.log('Cache expired, triggering background refresh');
          // Don't await - let it run in background
          aiPredictionsApi.getImmediatePredictions(user.id, true).catch(err => 
            console.error('Background refresh failed:', err)
          );
        }
      } else if (supabaseResult.status === 'needs_data') {
        // Not enough data, show appropriate message
        setData({
          status: 'insufficient_data',
          predictions: [],
          data_quality_score: supabaseResult.data_quality_score || 0
        });
      } else if (shouldCallBackend) {
        // Layer 3: Fallback to backend API
        console.log('Calling backend for predictions, status:', supabaseResult.status);
        const response = await aiPredictionsApi.getImmediatePredictions(user.id, forceRefresh);
        
        // Handle legacy field names
        if (response.predictions) {
          response.predictions = response.predictions.map(p => ({
            ...p,
            type: 'immediate' as const,
            prevention_protocol: p.prevention_protocol || p.preventionProtocols || [],
            subtitle: p.subtitle || p.description,
            gradient: p.gradient || getDefaultGradient(p.severity || 'info')
          }));
        }
        
        setData(response);
        
        // Cache successful responses
        if (response.status === 'success' || response.status === 'cached') {
          aiPredictionCache.set(cacheKey, response, 5);
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching immediate predictions:', err);
      
      // Try to use any stale data we might have
      const staleData = aiPredictionCache.get<PredictionsResponse<ImmediatePrediction>>(cacheKey, true);
      if (staleData) {
        console.log('Using stale cached data due to error');
        setData({ ...staleData, status: 'cached' });
      }
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

  return {
    predictions: data?.predictions || [],
    dataQualityScore: data?.data_quality_score || 0,
    isLoading,
    isRefreshing,
    error,
    status: data?.status || 'loading',
    refresh
  };
}

// Helper function to get default gradient based on severity
function getDefaultGradient(severity: string): string {
  const gradients: Record<string, string> = {
    info: 'from-blue-600/10 to-indigo-600/10',
    warning: 'from-yellow-600/10 to-orange-600/10',
    alert: 'from-red-600/10 to-pink-600/10',
    critical: 'from-red-600/10 to-pink-600/10'
  };
  return gradients[severity] || 'from-gray-600/10 to-slate-600/10';
}