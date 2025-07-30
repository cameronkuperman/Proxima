import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AIPrediction {
  id: string;
  type: 'immediate' | 'seasonal' | 'longterm';
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  pattern: string;
  confidence: number;
  preventionProtocols: string[];
  category: string;
  reasoning?: string;
  dataPoints?: string[];
  gradient?: string;
  generated_at: string;
}

export function useAIPredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
        const response = await fetch(
          `${API_URL}/api/ai/predictions/${user.id}`
        );

        if (!response.ok) throw new Error('Failed to fetch predictions');

        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching AI predictions:', err);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(interval);
  }, [user?.id]);

  return { predictions, isLoading, error };
}