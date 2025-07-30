import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BodyPatterns {
  tendencies: string[];
  positiveResponses: string[];
}

export function useAIBodyPatterns() {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<BodyPatterns | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPatterns = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
        const response = await fetch(
          `${API_URL}/api/ai/body-patterns/${user.id}`
        );

        if (!response.ok) throw new Error('Failed to fetch body patterns');

        const data = await response.json();
        setPatterns(data.patterns);
      } catch (error) {
        console.error('Error fetching body patterns:', error);
        setPatterns(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatterns();
  }, [user?.id]);

  return { patterns, isLoading };
}