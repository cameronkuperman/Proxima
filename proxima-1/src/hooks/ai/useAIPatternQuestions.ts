import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { aiPredictionsApi, aiPredictionCache } from '@/lib/api/aiPredictions';
import { PatternQuestionsResponse, PatternQuestion } from '@/types/aiPredictions';

export function useAIPatternQuestions() {
  const { user } = useAuth();
  const [data, setData] = useState<PatternQuestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatternQuestions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const cacheKey = aiPredictionCache.keys.patternQuestions(user.id);
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = aiPredictionCache.get<PatternQuestionsResponse>(cacheKey);
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

      const response = await aiPredictionsApi.getPatternQuestions(user.id, forceRefresh);
      
      // Handle legacy field names in questions
      if (response.questions) {
        response.questions = response.questions.map(q => ({
          ...q,
          // Ensure new structure is used
          brief_answer: q.brief_answer || q.answer || '',
          deep_dive: q.deep_dive || {
            detailed_insights: q.deepDive || [],
            connected_patterns: q.connections || [],
            actionable_advice: []
          },
          relevance_score: q.relevance_score || q.relevanceScore || 0,
          based_on: q.based_on || q.basedOn || []
        }));
      }
      
      setData(response);
      
      // Cache successful responses
      if (response.status === 'success' || response.status === 'cached') {
        aiPredictionCache.set(cacheKey, response, 5);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching pattern questions:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPatternQuestions();
  }, [fetchPatternQuestions]);

  const refresh = useCallback(() => {
    return fetchPatternQuestions(true);
  }, [fetchPatternQuestions]);

  // Helper to get icon for a question (with cool fallbacks)
  const getQuestionIcon = (question: PatternQuestion): string => {
    if (question.icon) return question.icon;
    
    // Map category to icon
    const iconMap: Record<string, string> = {
      mood: 'brain',
      sleep: 'moon',
      energy: 'battery',
      physical: 'heart'
    };
    
    return iconMap[question.category] || 'sparkles';
  };

  return {
    questions: data?.questions || [],
    totalQuestions: data?.total_questions || 0,
    categoriesCovered: data?.categories_covered || [],
    isLoading,
    isRefreshing,
    error,
    status: data?.status || 'loading',
    getQuestionIcon,
    refresh
  };
}