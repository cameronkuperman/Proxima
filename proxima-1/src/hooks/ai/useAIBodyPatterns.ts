import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiPredictionsApi, aiPredictionCache } from '@/lib/api/aiPredictions';
import { BodyPatternsResponse } from '@/types/aiPredictions';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';

export function useAIBodyPatterns() {
  const { user } = useAuth();
  const [data, setData] = useState<BodyPatternsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBodyPatterns = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const cacheKey = aiPredictionCache.keys.bodyPatterns(user.id);
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = aiPredictionCache.get<BodyPatternsResponse>(cacheKey);
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

      // First try Supabase for cached patterns
      const supabaseResult = await supabaseAIPredictionsService.getPredictionsByType(user.id, 'patterns');
      
      if (supabaseResult?.patterns && !forceRefresh) {
        const response: BodyPatternsResponse = {
          status: 'success',
          tendencies: supabaseResult.patterns.tendencies || [],
          positive_responses: supabaseResult.patterns.positive_responses || supabaseResult.patterns.positiveResponses || [],
          pattern_metadata: supabaseResult.patterns.pattern_metadata
        };
        
        setData(response);
        aiPredictionCache.set(cacheKey, response, 5);
      } else {
        // Fallback to backend API
        const response = await aiPredictionsApi.getBodyPatterns(user.id, forceRefresh);
        
        // Handle legacy field names
        if (response.positiveResponses && !response.positive_responses) {
          response.positive_responses = response.positiveResponses;
        }
        
        setData(response);
        
        // Cache successful responses
        if (response.status === 'success' || response.status === 'cached') {
          aiPredictionCache.set(cacheKey, response, 5);
        }
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching body patterns:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBodyPatterns();
  }, [fetchBodyPatterns]);

  const refresh = useCallback(() => {
    return fetchBodyPatterns(true);
  }, [fetchBodyPatterns]);

  return {
    bodyPatterns: data,
    tendencies: data?.tendencies || [],
    positiveResponses: data?.positive_responses || data?.positiveResponses || [],
    patternMetadata: data?.pattern_metadata,
    isLoading,
    isRefreshing,
    error,
    status: data?.status || 'loading',
    refresh
  };
}