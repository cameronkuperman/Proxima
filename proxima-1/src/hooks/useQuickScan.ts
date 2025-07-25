import { useState, useCallback } from 'react';
import { quickScanClient, QuickScanFormData, QuickScanResponse } from '@/lib/quickscan-client';
import { useAuth } from '@/contexts/AuthContext';

export const useQuickScan = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<QuickScanResponse | null>(null);

  const performScan = useCallback(async (
    bodyPart: string,
    formData: QuickScanFormData
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await quickScanClient.performQuickScan(
        bodyPart,
        formData,
        user?.id
      );
      
      setScanResult(result);
      
      // If user is authenticated, generate summary
      if (user?.id && result.scan_id) {
        // Fire and forget - don't wait for summary
        quickScanClient.generateSummary(result.scan_id, user.id).catch(err => {
          console.warn('Summary generation failed:', err);
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quick scan failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const reset = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  return {
    performScan,
    isLoading,
    error,
    scanResult,
    reset,
  };
};