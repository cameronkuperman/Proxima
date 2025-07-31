import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { reportApi } from '@/lib/api/reports';
import { MedicalReport, ReportAnalysisResponse, SpecialtyType } from '@/types/reports';

interface TriageResult {
  primary_specialty: SpecialtyType;
  confidence: number;
  reasoning: string;
  secondary_specialties?: Array<{
    specialty: SpecialtyType;
    confidence: number;
    reason: string;
  }>;
  urgency: 'routine' | 'urgent' | 'emergent';
  red_flags?: string[];
  recommended_timing: string;
}

interface ReportStore {
  // State
  triageResult: TriageResult | null;
  currentReport: MedicalReport | null;
  reportHistory: MedicalReport[];
  loading: boolean;
  error: string | null;
  analysisId: string | null;

  // Actions
  runTriage: (params: {
    user_id?: string;
    quick_scan_ids?: string[];
    deep_dive_ids?: string[];
    primary_concern?: string;
    symptoms?: string[];
    urgency?: string;
  }) => Promise<TriageResult | null>;
  
  generateReport: (specialty: SpecialtyType, analysisId: string, userId?: string) => Promise<void>;
  
  loadReport: (reportId: string) => Promise<void>;
  
  loadUserReports: (userId: string) => Promise<void>;
  
  clearCurrentReport: () => void;
  clearError: () => void;
  setAnalysisId: (id: string) => void;
}

export const useReportStore = create<ReportStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      triageResult: null,
      currentReport: null,
      reportHistory: [],
      loading: false,
      error: null,
      analysisId: null,

      // Run specialty triage
      runTriage: async (params) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/report/specialty-triage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          });

          if (!response.ok) {
            throw new Error('Failed to run triage');
          }

          const data = await response.json();
          
          if (data.status === 'success' && data.triage_result) {
            set({ 
              triageResult: data.triage_result,
              loading: false 
            });
            return data.triage_result;
          } else {
            throw new Error('Invalid response from triage service');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to run triage',
            loading: false 
          });
          return null;
        }
      },

      // Generate specialist report
      generateReport: async (specialty: SpecialtyType, analysisId: string, userId?: string) => {
        set({ loading: true, error: null });
        try {
          const report = await reportApi.generateSpecialistReport(specialty, analysisId, userId);
          
          set({ 
            currentReport: report,
            reportHistory: [...get().reportHistory, report],
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate report',
            loading: false 
          });
        }
      },

      // Load specific report
      loadReport: async (reportId: string) => {
        set({ loading: true, error: null });
        try {
          const report = await reportApi.getReport(reportId);
          set({ 
            currentReport: report,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load report',
            loading: false 
          });
        }
      },

      // Load user's report history
      loadUserReports: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const reports = await reportApi.getUserReports(userId);
          set({ 
            reportHistory: reports,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load report history',
            loading: false 
          });
        }
      },

      // Clear current report
      clearCurrentReport: () => set({ currentReport: null }),

      // Clear error
      clearError: () => set({ error: null }),

      // Set analysis ID
      setAnalysisId: (id: string) => set({ analysisId: id })
    }),
    {
      name: 'report-store'
    }
  )
);