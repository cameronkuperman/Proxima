import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AIPatternQuestion {
  id: string;
  question: string;
  category: 'sleep' | 'energy' | 'mood' | 'physical' | 'other';
  answer: string;
  deepDive: string[];
  connections: string[];
  relevanceScore: number;
  basedOn: string[];
}

export function useAIPatternQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<AIPatternQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const generateQuestions = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
        const response = await fetch(
          `${API_URL}/api/ai/pattern-questions/${user.id}`
        );

        if (!response.ok) throw new Error('Failed to generate questions');

        const data = await response.json();
        const sortedQuestions = (data.questions || []).sort(
          (a: any, b: any) => b.relevanceScore - a.relevanceScore
        );
        setQuestions(sortedQuestions);
      } catch (error) {
        console.error('Error generating pattern questions:', error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, [user?.id]);

  return { questions, isLoading };
}