// Health Intelligence React Hooks
import { useState, useEffect } from 'react';
import { healthIntelligenceAPI, HealthAnalysisResponse } from '@/lib/api/health-intelligence';
import { useAuth } from '@/contexts/AuthContext';

export function useHealthAnalysis(weekOf?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<HealthAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const analysis = await healthIntelligenceAPI.getAnalysis(user.id, weekOf);
        setData(analysis);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch health analysis:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [user?.id, weekOf]);

  return { data, isLoading, error };
}

export function useGenerateAnalysis() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = async (forceRefresh = false) => {
    if (!user?.id) return;

    try {
      setIsGenerating(true);
      setError(null);
      await healthIntelligenceAPI.generateWeeklyAnalysis(user.id, forceRefresh);
      // Return true to indicate success
      return true;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to generate analysis:', err);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, error };
}

export function useExportPDF() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportPDF = async (storyIds: string[], options?: {
    includeAnalysis?: boolean;
    includeNotes?: boolean;
  }) => {
    if (!user?.id) return null;

    try {
      setIsExporting(true);
      setError(null);
      const result = await healthIntelligenceAPI.exportPDF(user.id, storyIds, options);
      return result;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to export PDF:', err);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPDF, isExporting, error };
}

export function useShareWithDoctor() {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const share = async (storyIds: string[], options?: {
    recipientEmail?: string;
    expiresInDays?: number;
  }) => {
    if (!user?.id) return null;

    try {
      setIsSharing(true);
      setError(null);
      const result = await healthIntelligenceAPI.shareWithDoctor(user.id, storyIds, options);
      return result;
    } catch (err) {
      setError(err as Error);
      console.error('Failed to create share link:', err);
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing, error };
}