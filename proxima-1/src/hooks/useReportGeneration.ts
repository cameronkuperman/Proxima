import { useState, useCallback } from 'react';
import { reportService, ReportAnalyzeRequest, ReportAnalyzeResponse, MedicalReport } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';

interface ReportGenerationState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  analysis: ReportAnalyzeResponse | null;
  report: MedicalReport | null;
  error: string | null;
}

export const useReportGeneration = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ReportGenerationState>({
    isAnalyzing: false,
    isGenerating: false,
    analysis: null,
    report: null,
    error: null,
  });

  const generateReport = useCallback(async (
    request: ReportAnalyzeRequest
  ): Promise<{ analysis: ReportAnalyzeResponse; report: MedicalReport } | null> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      console.log('Starting report generation with proper request structure:', request);
      
      // Ensure user_id is set
      const requestWithUserId = {
        ...request,
        user_id: request.user_id || user?.id,
      };
      
      // Use the new analyzeAndGenerate method which follows the proper API flow
      const result = await reportService.analyzeAndGenerate(requestWithUserId);
      
      console.log('Analysis completed:', result.analysis);
      setState(prev => ({ 
        ...prev, 
        analysis: result.analysis, 
        isAnalyzing: false,
        isGenerating: true 
      }));

      console.log('Report generation completed:', result.report);
      setState(prev => ({ 
        ...prev, 
        report: result.report, 
        isGenerating: false 
      }));

      return result;
    } catch (error) {
      console.error('Report generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isAnalyzing: false,
        isGenerating: false 
      }));
      return null;
    }
  }, [user]);

  // Legacy method for backward compatibility
  const generateReportLegacy = useCallback(async (context: any, userId?: string) => {
    const request: ReportAnalyzeRequest = {
      user_id: userId || user?.id,
      context: context,
    };
    return generateReport(request);
  }, [generateReport, user]);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      isGenerating: false,
      analysis: null,
      report: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    generateReport,
    generateReportLegacy, // For backward compatibility
    reset,
  };
};