import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { healthScoreAPI, HealthScoreWithComparison } from '@/lib/api/health-score';

interface UseHealthScoreReturn {
  scoreData: HealthScoreWithComparison | null;
  loading: boolean;
  error: string | null;
  refreshScore: () => Promise<void>;
  isRefreshing: boolean;
}

export function useHealthScore(): UseHealthScoreReturn {
  const { user } = useAuth();
  const [scoreData, setScoreData] = useState<HealthScoreWithComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealthScore = async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      if (forceRefresh) {
        setIsRefreshing(true);
        const data = await healthScoreAPI.refreshHealthScore(user.id);
        setScoreData(data);
      } else {
        setLoading(true);
        const data = await healthScoreAPI.getHealthScore(user.id);
        setScoreData(data);
      }
    } catch (err) {
      console.error('Error fetching health score:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health score');
      
      // Set fallback data
      setScoreData({
        score: 80,
        actions: [
          { icon: '💧', text: 'Stay hydrated throughout the day' },
          { icon: '🏃', text: 'Get 30 minutes of physical activity' },
          { icon: '🧘', text: 'Practice stress reduction techniques' }
        ],
        reasoning: 'Unable to calculate personalized score',
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        cached: false
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshScore = async () => {
    await fetchHealthScore(true);
  };

  useEffect(() => {
    fetchHealthScore();
  }, [user?.id]);

  // Check if we should show "new score available" notification
  useEffect(() => {
    if (!scoreData) return;

    const checkForNewScore = () => {
      const now = new Date();
      const generatedAt = new Date(scoreData.generated_at);
      const daysSinceGenerated = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);

      // If it's been more than 7 days, we might have a new score
      if (daysSinceGenerated >= 7) {
        // The backend generates new scores on Mondays
        const today = now.getDay();
        if (today === 1) { // Monday
          // Check if we need to fetch a new score
          const lastMondayMidnight = new Date(now);
          lastMondayMidnight.setHours(0, 0, 0, 0);
          
          if (generatedAt < lastMondayMidnight) {
            fetchHealthScore();
          }
        }
      }
    };

    // Check on mount and set up interval
    checkForNewScore();
    const interval = setInterval(checkForNewScore, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [scoreData]);

  return {
    scoreData,
    loading,
    error,
    refreshScore,
    isRefreshing
  };
}