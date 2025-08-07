import { supabase } from '@/lib/supabase';

export interface MedicalReport {
  id: string;
  user_id: string;
  report_type: 'comprehensive' | 'urgent_triage' | 'symptom_timeline' | 'specialist_focused' | 'photo_progression' | 'annual_summary' | 'primary_care' | 'cardiology' | 'neurology' | 'psychiatry' | 'dermatology' | 'gastroenterology' | 'endocrinology' | 'pulmonology' | 'orthopedics' | 'rheumatology' | 'nephrology' | 'urology' | 'gynecology' | 'oncology' | 'physical_therapy';
  created_at: string;
  report_data: any;
  executive_summary: string;
  confidence_score: number | null;
  model_used: string | null;
  data_sources: any;
  time_range: any;
  last_accessed: string | null;
  access_count: number;
  specialty: string | null;
  metadata: any;
}

export interface GeneratedReport {
  id: string;
  user_id: string;
  report_type: string;
  title: string;
  created_at: string;
  last_accessed?: string;
  executive_summary: string;
  confidence_score: number;
  source_data: {
    quick_scan_ids?: string[];
    deep_dive_ids?: string[];
    photo_session_ids?: string[];
  };
  report_data: any;
  specialty?: string;
  full_report?: any;
  tags?: string[];
}

// Convert Supabase medical report to the format expected by the dashboard
function convertToGeneratedReport(report: MedicalReport): GeneratedReport {
  // Extract title from report_data or metadata, or generate from report type
  let title = report.metadata?.title || 
              report.report_data?.title || 
              formatReportTypeTitle(report.report_type);
  
  // Extract source data from report_data or data_sources
  const sourceData = {
    quick_scan_ids: report.data_sources?.quick_scan_ids || [],
    deep_dive_ids: report.data_sources?.deep_dive_ids || [],
    photo_session_ids: report.data_sources?.photo_session_ids || []
  };
  
  // Extract tags from metadata or generate based on report type
  const tags = report.metadata?.tags || generateTags(report.report_type, report.specialty);
  
  return {
    id: report.id,
    user_id: report.user_id,
    report_type: report.report_type,
    title: title,
    created_at: report.created_at,
    last_accessed: report.last_accessed || undefined,
    executive_summary: report.executive_summary,
    confidence_score: report.confidence_score || 85,
    source_data: sourceData,
    report_data: report.report_data,
    specialty: report.specialty || undefined,
    full_report: report.report_data,
    tags: tags
  };
}

// Helper function to format report type into a readable title
function formatReportTypeTitle(reportType: string): string {
  const typeMap: Record<string, string> = {
    'comprehensive': 'Comprehensive Health Report',
    'urgent_triage': 'Urgent Triage Assessment',
    'symptom_timeline': 'Symptom Timeline Analysis',
    'specialist_focused': 'Specialist Consultation Report',
    'photo_progression': 'Photo Progression Analysis',
    'annual_summary': 'Annual Health Summary',
    'primary_care': 'Primary Care Report',
    'cardiology': 'Cardiology Report',
    'neurology': 'Neurology Report',
    'psychiatry': 'Psychiatry Report',
    'dermatology': 'Dermatology Report',
    'gastroenterology': 'Gastroenterology Report',
    'endocrinology': 'Endocrinology Report',
    'pulmonology': 'Pulmonology Report',
    'orthopedics': 'Orthopedics Report',
    'rheumatology': 'Rheumatology Report',
    'nephrology': 'Nephrology Report',
    'urology': 'Urology Report',
    'gynecology': 'Gynecology Report',
    'oncology': 'Oncology Report',
    'physical_therapy': 'Physical Therapy Report'
  };
  
  return typeMap[reportType] || 'Health Report';
}

// Helper function to generate tags based on report type and specialty
function generateTags(reportType: string, specialty?: string | null): string[] {
  const tags: string[] = [];
  
  // Add report type tag
  tags.push(reportType.replace('_', ' '));
  
  // Add specialty tag if available
  if (specialty) {
    tags.push(specialty);
  }
  
  // Add specific tags based on report type
  switch (reportType) {
    case 'urgent_triage':
      tags.push('urgent', 'immediate attention');
      break;
    case 'symptom_timeline':
      tags.push('timeline', 'progression');
      break;
    case 'photo_progression':
      tags.push('visual analysis', 'progression');
      break;
    case 'annual_summary':
      tags.push('yearly', 'comprehensive');
      break;
    case 'comprehensive':
      tags.push('detailed', 'full assessment');
      break;
  }
  
  return tags;
}

export const supabaseReportsService = {
  // Fetch user's medical reports directly from Supabase
  async fetchUserReports(userId: string): Promise<GeneratedReport[]> {
    try {
      console.log('📊 Fetching reports from Supabase for user:', userId);
      
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Fetch up to 50 most recent reports
      
      if (error) {
        console.error('❌ Error fetching reports from Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('ℹ️ No reports found for user');
        return [];
      }
      
      console.log(`✅ Found ${data.length} reports in Supabase`);
      
      // Convert Supabase format to dashboard format
      const reports = data.map(convertToGeneratedReport);
      
      return reports;
    } catch (error) {
      console.error('❌ Failed to fetch reports from Supabase:', error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  },
  
  // Get a specific report
  async getReport(reportId: string): Promise<GeneratedReport | null> {
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching report:', error);
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Update access count and last_accessed
      await supabase
        .from('medical_reports')
        .update({
          access_count: (data.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', reportId);
      
      return convertToGeneratedReport(data);
    } catch (error) {
      console.error('❌ Failed to fetch report:', error);
      return null;
    }
  },
  
  // Mark report as accessed (update last_accessed timestamp)
  async markReportAccessed(reportId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medical_reports')
        .update({
          last_accessed: new Date().toISOString()
        })
        .eq('id', reportId);
      
      if (error) {
        console.error('❌ Error updating report access time:', error);
      }
    } catch (error) {
      console.error('❌ Failed to mark report as accessed:', error);
    }
  },
  
  // Group reports by month for timeline view
  groupReportsByMonth(reports: GeneratedReport[]): Map<string, GeneratedReport[]> {
    const grouped = new Map<string, GeneratedReport[]>();
    
    if (!Array.isArray(reports)) {
      console.warn('groupReportsByMonth: reports is not an array, returning empty map');
      return grouped;
    }
    
    reports.forEach(report => {
      if (!report || !report.created_at) {
        console.warn('Skipping invalid report:', report);
        return;
      }
      
      const date = new Date(report.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(report);
    });
    
    // Sort by date within each month
    grouped.forEach((monthReports) => {
      monthReports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    
    return grouped;
  },
  
  // Get available health data for report generation from Supabase
  async getAvailableHealthData(userId: string) {
    try {
      // Fetch quick scans
      const { data: quickScans } = await supabase
        .from('quick_scans')
        .select('id, body_part, created_at, urgency_level, confidence_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Fetch deep dive sessions
      const { data: deepDives } = await supabase
        .from('deep_dive_sessions')
        .select('id, body_part, created_at, status, final_confidence')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Fetch photo sessions
      const { data: photoSessions } = await supabase
        .from('photo_sessions')
        .select('id, condition_name, created_at, last_photo_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      return {
        quickScans: quickScans || [],
        deepDives: deepDives || [],
        photoSessions: photoSessions || []
      };
    } catch (error) {
      console.error('Error fetching health data from Supabase:', error);
      return {
        quickScans: [],
        deepDives: [],
        photoSessions: []
      };
    }
  }
};