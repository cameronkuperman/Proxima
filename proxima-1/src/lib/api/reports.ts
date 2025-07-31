import { 
  ReportAnalysisRequest, 
  ReportAnalysisResponse, 
  MedicalReport, 
  SpecialtyType 
} from '@/types/reports';

const API_BASE = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:8000';

export const reportApi = {
  // Step 1: Analyze what report to generate
  async analyzeReport(request: ReportAnalysisRequest): Promise<ReportAnalysisResponse> {
    const res = await fetch(`${API_BASE}/api/report/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Failed to analyze report');
    return res.json();
  },

  // Step 2: Generate the actual report
  async generateReport(endpoint: string, request: any): Promise<MedicalReport> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  // Direct specialist report generation
  async generateSpecialistReport(
    specialty: SpecialtyType,
    analysisId: string,
    userId?: string
  ): Promise<MedicalReport> {
    return this.generateReport(`/api/report/${specialty}`, {
      analysis_id: analysisId,
      user_id: userId,
      specialty
    });
  },
  
  // Specialty triage
  async runSpecialtyTriage(params: {
    user_id?: string;
    quick_scan_ids?: string[];
    deep_dive_ids?: string[];
    primary_concern?: string;
    symptoms?: string[];
    urgency?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/report/specialty-triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to run triage');
    return res.json();
  },

  // Time-based reports
  async generate30DayReport(userId: string): Promise<MedicalReport> {
    const res = await fetch(`${API_BASE}/api/report/30-day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to generate 30-day report');
    return res.json();
  },

  async generateAnnualReport(userId: string): Promise<MedicalReport> {
    const res = await fetch(`${API_BASE}/api/report/annual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to generate annual report');
    return res.json();
  },

  // Get user's reports
  async getUserReports(userId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/reports?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  // Get specific report
  async getReport(reportId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/reports/${reportId}`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  }
};