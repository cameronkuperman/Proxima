import { generateMockHealthInteractions } from './mockHealthInteractions';

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:8000';

export interface GeneratedReport {
  id: string;
  user_id: string;
  report_type: 'comprehensive' | 'urgent_triage' | 'symptom_timeline' | 'specialist_focused' | 'photo_progression' | 'annual_summary';
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

// Use real backend data - mock data disabled
const USE_MOCK_DATA = false;

// Generate mock past reports
function generateMockReports(): GeneratedReport[] {
  return [
    {
      id: 'report-1',
      user_id: 'user-123',
      report_type: 'symptom_timeline',
      title: 'Migraine Pattern Analysis',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: 'Analysis of recurring headaches over the past month shows a pattern linked to stress and sleep deprivation. Frequency decreased by 40% with lifestyle changes.',
      confidence_score: 88,
      source_data: {
        quick_scan_ids: ['qs-1', 'qs-2'],
        deep_dive_ids: ['dd-1'],
      },
      tags: ['headache', 'migraine', 'stress', 'pattern-analysis', 'sleep-correlation'],
      report_data: {
        pattern_analysis: {
          correlations: [
            {
              factor: 'Sleep Quality',
              strength: 85,
              description: 'Headaches occur 78% more often after less than 6 hours of sleep'
            },
            {
              factor: 'Work Stress',
              strength: 72,
              description: 'Pain intensity increases by 40% during high-stress work periods'
            },
            {
              factor: 'Screen Time',
              strength: 65,
              description: 'Symptoms worsen with >8 hours of daily screen exposure'
            }
          ],
          triggers: [
            {
              name: 'Poor Posture',
              frequency: '85% of episodes',
              impact: 'Increases pain severity by average of 2.3 points'
            },
            {
              name: 'Caffeine Withdrawal',
              frequency: '60% of morning episodes',
              impact: 'Triggers headaches within 2-4 hours of missed caffeine intake'
            }
          ]
        },
        symptom_timeline: {
          events: [
            { date: '2024-01-15', severity: 8, notes: 'Severe migraine during project deadline' },
            { date: '2024-01-12', severity: 5, notes: 'Moderate tension headache, improved with rest' },
            { date: '2024-01-08', severity: 6, notes: 'Morning headache, likely sleep-related' },
            { date: '2024-01-05', severity: 3, notes: 'Mild discomfort, managed with hydration' },
            { date: '2024-01-02', severity: 7, notes: 'New Year stress-related episode' }
          ]
        },
        treatment_analysis: {
          interventions: [
            {
              name: 'Ibuprofen 400mg',
              effectiveness: 85,
              description: 'Provides relief within 30-45 minutes for 80% of episodes'
            },
            {
              name: 'Dark Room Rest',
              effectiveness: 90,
              description: 'Most effective non-medication intervention'
            },
            {
              name: 'Improved Sleep Schedule',
              effectiveness: 75,
              description: 'Reduced frequency by 40% over past month'
            },
            {
              name: 'Stress Management',
              effectiveness: 60,
              description: 'Meditation shows moderate improvement in intensity'
            }
          ]
        },
        key_findings: [
          'Headaches occur 2-3 times per week with 85% correlation to sleep quality',
          'Strong pattern linking work stress to symptom intensity (+40% severity)',
          'Treatment response excellent: Ibuprofen effective in 85% of cases',
          'Environmental triggers identified: screen time, poor posture, caffeine patterns',
          'Significant improvement (40% reduction) with consistent sleep schedule'
        ],
        recommendations: [
          {
            action: 'Implement strict sleep hygiene protocol',
            rationale: '85% correlation between sleep quality and headache frequency',
            priority: 'high'
          },
          {
            action: 'Ergonomic workspace evaluation',
            rationale: 'Poor posture triggers 85% of episodes',
            priority: 'high'
          },
          {
            action: 'Stress management program',
            rationale: 'Work stress increases pain intensity by 40%',
            priority: 'medium'
          },
          {
            action: 'Caffeine intake regulation',
            rationale: 'Withdrawal triggers 60% of morning headaches',
            priority: 'medium'
          }
        ]
      }
    },
    {
      id: 'report-2',
      user_id: 'user-123',
      report_type: 'specialist_focused',
      title: 'Cardiology Referral Report',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: 'Comprehensive report for cardiology consultation regarding exercise-induced chest discomfort. All episodes resolved with rest, no red flags identified.',
      confidence_score: 92,
      source_data: {
        quick_scan_ids: ['qs-3'],
        deep_dive_ids: ['dd-2'],
      },
      tags: ['chest pain', 'cardiology', 'exercise'],
      report_data: {
        pattern_analysis: {
          correlations: [
            {
              factor: 'Exercise Intensity',
              strength: 95,
              description: 'Chest discomfort occurs only during moderate to high-intensity exercise (>70% max HR)'
            },
            {
              factor: 'Recovery Time',
              strength: 88,
              description: 'Symptoms resolve completely within 2-3 minutes of rest in 100% of episodes'
            }
          ],
          triggers: [
            {
              name: 'Cardiovascular Exertion',
              frequency: '100% of episodes',
              impact: 'Mild to moderate chest tightness, self-limiting'
            }
          ]
        },
        clinical_summary: {
          presenting_complaint: 'Exercise-induced chest tightness',
          duration: '2 weeks, 6 documented episodes',
          severity: 'Mild to moderate (3-5/10)',
          associated_symptoms: ['Shortness of breath', 'Complete resolution with rest'],
          vital_patterns: {
            heart_rate_response: 'Normal exercise response, appropriate recovery',
            symptom_onset: 'Consistently at 70-80% predicted max heart rate',
            recovery_time: 'Average 2.5 minutes to complete resolution'
          }
        },
        key_findings: [
          'Exercise-induced symptoms with consistent pattern and triggers',
          'Complete resolution with rest suggests non-cardiac etiology',
          'No symptoms at rest or during light activity',
          'Normal heart rate response and recovery patterns',
          'No associated red flag symptoms (syncope, palpitations, arm pain)'
        ],
        recommendations: [
          {
            action: 'Cardiology consultation for exercise stress testing',
            rationale: 'Rule out exercise-induced cardiac issues despite low probability',
            priority: 'high'
          },
          {
            action: 'Gradual exercise progression protocol',
            rationale: 'Symptoms occur at consistent intensity threshold',
            priority: 'medium'
          },
          {
            action: 'Monitor for symptom progression or change in pattern',
            rationale: 'Any deviation from current pattern warrants immediate evaluation',
            priority: 'high'
          }
        ]
      }
    },
    {
      id: 'report-3',
      user_id: 'user-123',
      report_type: 'comprehensive',
      title: 'Monthly Health Summary - January',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: 'Overall health status shows improvement. Main concerns addressed: recurring headaches (improved), lower back pain (stable), sleep quality (improved).',
      confidence_score: 85,
      source_data: {
        quick_scan_ids: ['qs-1', 'qs-2', 'qs-3'],
        deep_dive_ids: ['dd-1', 'dd-2'],
      },
      tags: ['monthly summary', 'comprehensive'],
      report_data: {
        health_metrics: {
          total_interactions: 8,
          main_concerns: ['Headaches', 'Back pain', 'Sleep issues'],
          improvement_areas: ['Sleep quality', 'Headache frequency']
        }
      }
    },
    {
      id: 'report-4',
      user_id: 'user-123',
      report_type: 'urgent_triage',
      title: 'Urgent Assessment - Severe Headache',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: 'Severe headache with new characteristics requiring medical evaluation within 24-48 hours. Red flags: sudden onset, worst headache ever reported.',
      confidence_score: 95,
      source_data: {
        quick_scan_ids: ['qs-4'],
      },
      tags: ['urgent', 'headache', 'red flags'],
      report_data: {
        triage_recommendation: 'Seek medical evaluation within 24-48 hours',
        red_flags: ['Sudden onset', 'Severe intensity', 'Different from usual pattern'],
        immediate_actions: ['Rest in dark room', 'Stay hydrated', 'Avoid triggers']
      }
    },
    {
      id: 'report-5',
      user_id: 'user-123',
      report_type: 'photo_progression',
      title: 'Skin Condition Progress Report',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: 'Photo analysis shows 60% improvement in skin rash over 3-week period. Redness significantly reduced, no new lesions observed.',
      confidence_score: 82,
      source_data: {
        photo_session_ids: ['ps-1'],
      },
      tags: ['dermatology', 'rash', 'improvement'],
      report_data: {
        visual_analysis: {
          improvement_rate: '60%',
          key_changes: ['Reduced redness', 'Decreased inflammation', 'No spreading'],
          timeline: '3 weeks'
        }
      }
    },
    {
      id: 'report-6',
      user_id: 'user-123',
      report_type: 'symptom_timeline',
      title: 'Back Pain Tracking Report',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      executive_summary: 'Lower back pain analysis over 4 weeks shows correlation with posture and activity levels. Pain decreased with ergonomic improvements.',
      confidence_score: 87,
      source_data: {
        quick_scan_ids: ['qs-5', 'qs-6'],
        deep_dive_ids: ['dd-3'],
      },
      tags: ['back pain', 'posture', 'ergonomics'],
      report_data: {
        pain_pattern: {
          frequency: 'Daily, worse in afternoon',
          triggers: ['Prolonged sitting', 'Poor posture'],
          relief_factors: ['Stretching', 'Walking', 'Ergonomic chair']
        }
      }
    }
  ];
}

export const reportsService = {
  // Fetch user's past generated reports
  async fetchUserReports(userId: string): Promise<GeneratedReport[]> {
    if (USE_MOCK_DATA) {
      return generateMockReports()
        .filter(r => r.user_id === userId || !userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    console.log('🔗 reportsService - Fetching from URL:', `${API_BASE_URL}/api/report/list/${userId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/report/list/${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🔗 reportsService - Response status:', response.status);
    console.log('🔗 reportsService - Response ok:', response.ok);

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    const result = await response.json();
    console.log('🔗 reportsService - Raw API response:', result);
    
    // Ensure we always return an array
    if (Array.isArray(result)) {
      return result as GeneratedReport[];
    } else if (result && typeof result === 'object' && Array.isArray(result.reports)) {
      // Handle case where backend returns { reports: [...] }
      console.log('🔗 reportsService - Extracting reports array from wrapper object');
      return result.reports as GeneratedReport[];
    } else {
      console.warn('🔗 reportsService - Unexpected response format, returning empty array:', result);
      return [];
    }
  },

  // Group reports by month for timeline view
  groupReportsByMonth(reports: GeneratedReport[]): Map<string, GeneratedReport[]> {
    const grouped = new Map<string, GeneratedReport[]>();
    
    // Ensure reports is an array
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

  // Get a specific report
  async getReport(reportId: string): Promise<GeneratedReport> {
    if (USE_MOCK_DATA) {
      const reports = generateMockReports();
      const report = reports.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');
      return report;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/report/${reportId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }

    return response.json();
  },

  // Mark report as accessed
  async markReportAccessed(reportId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      // In real implementation, this would update the last_accessed timestamp
      return;
    }

    await fetch(
      `${API_BASE_URL}/api/reports/${reportId}/access`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  // Get available health data for report generation
  async getAvailableHealthData(userId: string) {
    if (USE_MOCK_DATA) {
      // This would fetch available quick scans, deep dives, etc. that can be used to generate new reports
      const healthData = generateMockHealthInteractions();
      
      return {
        quickScans: healthData.filter(i => i.type === 'quick_scan'),
        deepDives: healthData.filter(i => i.type === 'deep_dive'),
        photoSessions: healthData.filter(i => i.type === 'photo_session'),
      };
    }

    // Use real Supabase data
    try {
      const { healthInteractionsService } = await import('./healthInteractionsService');
      const interactions = await healthInteractionsService.fetchUserInteractions(userId);
      
      return {
        quickScans: interactions.filter(i => i.type === 'quick_scan'),
        deepDives: interactions.filter(i => i.type === 'deep_dive'),
        photoSessions: interactions.filter(i => i.type === 'photo_session'),
      };
    } catch (error) {
      console.error('Error fetching real health data:', error);
      // Fallback to empty arrays
      return {
        quickScans: [],
        deepDives: [],
        photoSessions: [],
      };
    }
  },

  // Save a newly generated report
  async saveGeneratedReport(report: GeneratedReport): Promise<void> {
    if (USE_MOCK_DATA) {
      // In mock mode, just log it
      console.log('Saving generated report:', report);
      return;
    }

    await fetch(
      `${API_BASE_URL}/api/reports`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      }
    );
  }
};