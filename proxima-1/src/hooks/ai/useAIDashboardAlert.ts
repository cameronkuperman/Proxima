import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';

export interface DashboardAlert {
  alert: string;
  severity: 'warning' | 'info' | 'critical';
  confidence: number;
  action_required: string;
  gradient?: string;
  data_points?: string[];
}

export function useAIDashboardAlert() {
  const { user } = useAuth();
  const [alert, setAlert] = useState<DashboardAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'success' | 'loading' | 'error' | 'no_data'>('loading');

  const fetchAlert = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      setStatus('no_data');
      return;
    }

    try {
      setError(null);
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch dashboard alert from the correct prediction_type
      const result = await supabaseAIPredictionsService.getPredictionsByType(user.id, 'dashboard');
      
      if (result?.alert) {
        // Transform the alert to match expected format
        const dashboardAlert: DashboardAlert = {
          alert: result.alert.alert || result.alert.title || '',
          severity: result.alert.severity || 'info',
          confidence: result.alert.confidence || 0,
          action_required: result.alert.action_required || result.alert.description || '',
          gradient: result.alert.gradient,
          data_points: result.alert.data_points || []
        };
        
        setAlert(dashboardAlert);
        setStatus('success');
      } else {
        // Try backend API as fallback
        const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
        const response = await fetch(`${API_URL}/api/ai/dashboard-alert/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.alert) {
            setAlert(data.alert);
            setStatus('success');
          } else {
            setStatus('no_data');
          }
        } else {
          setStatus('no_data');
        }
      }
    } catch (err) {
      setError(err as Error);
      setStatus('error');
      console.error('Error fetching dashboard alert:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  const refresh = useCallback(() => {
    return fetchAlert(true);
  }, [fetchAlert]);

  return {
    alert,
    isLoading,
    isRefreshing,
    error,
    status,
    refresh
  };
}