import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AIAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timeframe: string;
  confidence: number;
  actionUrl: string;
  preventionTip?: string;
}

export function useAIPredictiveAlert() {
  const { user } = useAuth();
  const [alert, setAlert] = useState<AIAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchAlert = async () => {
      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
        const response = await fetch(
          `${API_URL}/api/ai/dashboard-alert/${user.id}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch alert');
        
        const data = await response.json();
        
        if (data.alert) {
          setAlert(data.alert);
          setLastUpdate(new Date());
        } else {
          setAlert(null);
        }
      } catch (error) {
        console.error('Error fetching AI alert:', error);
        setAlert(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlert();
    const interval = setInterval(fetchAlert, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [user?.id]);

  return { alert, isLoading, lastUpdate };
}