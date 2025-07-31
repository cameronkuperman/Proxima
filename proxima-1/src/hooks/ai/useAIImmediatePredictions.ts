import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiPredictionsApi, aiPredictionCache } from '@/lib/api/aiPredictions';
import { PredictionsResponse, ImmediatePrediction } from '@/types/aiPredictions';

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
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = aiPredictionCache.get<PredictionsResponse<ImmediatePrediction>>(cacheKey);
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
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching immediate predictions:', err);
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