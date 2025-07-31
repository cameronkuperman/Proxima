import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { HealthScoreResponse } from '@/types/health-score';

interface UseHealthScoreReturn {
  scoreData: HealthScoreResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchHealthScore: (forceRefresh?: boolean) => Promise<void>;
  isRefreshing: boolean;
}

// Helper function for authenticated API calls
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  console.log('🏥 Health Score Fetch:', {
    url,
    method: options.method || 'GET',
    timestamp: new Date().toISOString()
  });

  // Get the current session token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Failed to get session:', sessionError);
    throw new Error('Authentication error');
  }

  if (!session) {
    console.error('❌ No active session found');
    throw new Error('Not authenticated');
  }

  console.log('🎫 Session found for health score');

  // Add auth headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log('📥 Health Score Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Clone response to read body for logging
    const responseClone = response.clone();
    try {
      const responseData = await responseClone.text();
      console.log('📄 Response body:', responseData.substring(0, 500) + (responseData.length > 500 ? '...' : ''));
    } catch (e) {
      console.log('📄 Could not read response body');
    }

    return response;
  } catch (error) {
    console.error('🚨 Health Score Fetch error:', {
      url,
      error: error instanceof Error ? error.message : error,
      type: error instanceof TypeError ? 'Network/CORS error' : 'Other error'
    });
    throw error;
  }
}

export function useHealthScore(): UseHealthScoreReturn {
  const { user } = useAuth();
  const [scoreData, setScoreData] = useState<HealthScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchHealthScore();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchHealthScore = async (forceRefresh = false) => {
    if (!user?.id) {
      console.warn('⚠️ No user ID available for health score');
      return;
    }

    // Set appropriate loading state
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    console.log('🔍 Fetching health score:', {
      userId: user.id,
      forceRefresh
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const url = forceRefresh 
        ? `${API_URL}/api/health-score/${user.id}?force_refresh=true`
        : `${API_URL}/api/health-score/${user.id}`;

      const response = await authenticatedFetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Health score fetch failed:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Health score endpoint not found. Please check if the backend is deployed.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Failed to fetch health score: ${errorText}`);
        }
      }

      const data: HealthScoreResponse = await response.json();
      console.log('✅ Health score data:', data);

      // Validate the response structure
      if (typeof data.score !== 'number' || !Array.isArray(data.actions)) {
        console.error('❌ Invalid health score response structure:', data);
        throw new Error('Invalid response from server');
      }

      setScoreData(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health score';
      console.error('❌ Error fetching health score:', errorMessage);
      setError(errorMessage);
      
      // Don't clear existing data on error if we're just refreshing
      if (!forceRefresh) {
        setScoreData(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  return {
    scoreData,
    isLoading,
    error,
    fetchHealthScore,
    isRefreshing
  };
}