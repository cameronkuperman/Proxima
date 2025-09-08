import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import batchedApiService from '@/services/batchedApiService';
import { useTrackingStore } from '@/stores/useTrackingStore';

interface UseBatchedDashboardReturn {
  data: {
    healthScore: any;
    predictions: any;
    tracking: any;
    reports: any[];
    healthStory: any;
  } | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  cacheStatus: {
    cached: boolean;
    age?: number;
    isStale?: boolean;
    remainingTTL?: number;
  };
}

export function useBatchedDashboard(): UseBatchedDashboardReturn {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState({ cached: false });
  const fetchInProgress = useRef(false);
  
  // Get tracking store setter
  const setDashboardItems = useTrackingStore(state => state.dashboardItems);
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    // Prevent duplicate fetches
    if (fetchInProgress.current && !forceRefresh) {
      return;
    }
    
    fetchInProgress.current = true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear cache if force refresh
      if (forceRefresh) {
        batchedApiService.clearDashboardCache(user.id);
      }
      
      // Fetch batched data
      const result = await batchedApiService.fetchDashboardData(user.id);
      
      setData(result);
      
      // Update tracking store if we have tracking data
      if (result.tracking?.dashboard_items) {
        useTrackingStore.setState({ 
          dashboardItems: result.tracking.dashboard_items 
        });
      }
      
      // Update cache status
      const status = batchedApiService.getCacheStatus(user.id);
      setCacheStatus(status);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [user?.id]);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [user?.id]);
  
  // Refresh on window focus (with cache consideration)
  useEffect(() => {
    const handleFocus = () => {
      if (!document.hidden && user?.id) {
        // Check cache age before refreshing
        const status = batchedApiService.getCacheStatus(user.id);
        if (status.isStale) {
          console.log('🔄 Cache is stale, refreshing dashboard');
          fetchData();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, fetchData]);
  
  // Periodic cache status update
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      const status = batchedApiService.getCacheStatus(user.id);
      setCacheStatus(status);
      
      // Auto-refresh if cache is very stale (> 10 minutes)
      if (status.cached && status.age && status.age > 600) {
        console.log('⏰ Cache very stale, auto-refreshing');
        fetchData();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id, fetchData]);
  
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    error,
    refresh,
    cacheStatus
  };
}