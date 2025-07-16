import { generateMockHealthInteractions, generateMockHealthStats } from './mockHealthInteractions';
import { supabaseHealthService, QuickScanRecord, DeepDiveRecord, ConversationRecord } from './supabaseHealthService';

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:8000';

// Now using real Supabase data instead of mock data
const USE_MOCK_DATA = false; // Set to true for development/testing only

export interface QuickScanSession {
  id: string;
  user_id: string;
  body_part: string;
  symptoms: string;
  pain_level: number;
  duration: string;
  created_at: string;
  analysis?: {
    primary_condition: string;
    confidence: number;
    recommendations: string[];
  };
}

export interface DeepDiveSession {
  id: string;
  session_id: string;
  user_id: string;
  body_part: string;
  initial_symptoms: string;
  model: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  questions_asked: number;
  final_analysis?: {
    diagnosis: string;
    confidence: number;
    next_steps: string[];
  };
}

export interface PhotoSession {
  id: string;
  user_id: string;
  condition_name: string;
  photos_count: number;
  created_at: string;
  last_updated: string;
  analysis_summary?: string;
}

export interface HealthInteraction {
  id: string;
  type: 'quick_scan' | 'deep_dive' | 'photo_session' | 'symptom_tracking';
  timestamp: string;
  data: QuickScanSession | DeepDiveSession | PhotoSession;
}

export interface InteractionFilters {
  startDate?: Date;
  endDate?: Date;
  types?: ('quick_scan' | 'deep_dive' | 'photo_session' | 'symptom_tracking')[];
  bodyPart?: string;
  searchQuery?: string;
}

export const healthInteractionsService = {
  async fetchUserInteractions(
    userId: string,
    filters?: InteractionFilters
  ): Promise<HealthInteraction[]> {
    if (USE_MOCK_DATA) {
      // Return mock data with filtering applied
      let mockData = generateMockHealthInteractions();
      
      // Apply filters
      if (filters?.startDate) {
        mockData = mockData.filter(i => new Date(i.timestamp) >= filters.startDate!);
      }
      if (filters?.endDate) {
        mockData = mockData.filter(i => new Date(i.timestamp) <= filters.endDate!);
      }
      if (filters?.types?.length) {
        mockData = mockData.filter(i => filters.types!.includes(i.type));
      }
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        mockData = mockData.filter(i => {
          const data = i.data as any;
          return (
            data.symptoms?.toLowerCase().includes(query) ||
            data.initial_symptoms?.toLowerCase().includes(query) ||
            data.condition_name?.toLowerCase().includes(query) ||
            data.body_part?.toLowerCase().includes(query)
          );
        });
      }
      
      return mockData;
    }

    // Use real Supabase data
    try {
      const [quickScans, deepDives, conversations] = await Promise.all([
        supabaseHealthService.fetchQuickScans(userId, {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        }),
        supabaseHealthService.fetchDeepDiveSessions(userId, {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          status: 'completed', // Only include completed sessions
        }),
        supabaseHealthService.fetchUserConversations(userId, {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          includeMessages: false,
        }),
      ]);

      const interactions: HealthInteraction[] = [];

      // Convert Quick Scans to HealthInteractions
      if (!filters?.types || filters.types.includes('quick_scan')) {
        quickScans.forEach(scan => {
          const interaction: HealthInteraction = {
            id: scan.id,
            type: 'quick_scan',
            timestamp: scan.created_at,
            data: {
              id: scan.id,
              user_id: scan.user_id,
              body_part: scan.body_part,
              symptoms: scan.form_data.symptoms || '',
              pain_level: scan.form_data.painLevel || 0,
              duration: scan.form_data.duration || '',
              created_at: scan.created_at,
              analysis: {
                primary_condition: scan.analysis_result.primaryCondition,
                confidence: scan.analysis_result.confidence,
                recommendations: scan.analysis_result.recommendations,
              },
            } as QuickScanSession,
          };
          interactions.push(interaction);
        });
      }

      // Convert Deep Dives to HealthInteractions
      if (!filters?.types || filters.types.includes('deep_dive')) {
        deepDives.forEach(dive => {
          const interaction: HealthInteraction = {
            id: dive.id,
            type: 'deep_dive',
            timestamp: dive.created_at,
            data: {
              id: dive.id,
              session_id: dive.id,
              user_id: dive.user_id,
              body_part: dive.body_part,
              initial_symptoms: dive.form_data.symptoms || '',
              model: dive.model_used,
              status: dive.status,
              created_at: dive.created_at,
              completed_at: dive.completed_at,
              questions_asked: dive.questions?.length || 0,
              final_analysis: dive.final_analysis ? {
                diagnosis: dive.final_analysis.primaryCondition,
                confidence: dive.final_analysis.confidence,
                next_steps: dive.final_analysis.recommendations,
              } : undefined,
            } as DeepDiveSession,
          };
          interactions.push(interaction);
        });
      }

      // Apply additional filters
      let filteredInteractions = interactions;

      if (filters?.bodyPart) {
        filteredInteractions = filteredInteractions.filter(i => {
          const data = i.data as any;
          return data.body_part?.toLowerCase().includes(filters.bodyPart!.toLowerCase());
        });
      }

      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredInteractions = filteredInteractions.filter(i => {
          const data = i.data as any;
          return (
            data.symptoms?.toLowerCase().includes(query) ||
            data.initial_symptoms?.toLowerCase().includes(query) ||
            data.body_part?.toLowerCase().includes(query) ||
            data.analysis?.primary_condition?.toLowerCase().includes(query) ||
            data.final_analysis?.diagnosis?.toLowerCase().includes(query)
          );
        });
      }

      // Sort by timestamp (newest first)
      filteredInteractions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return filteredInteractions;
    } catch (error) {
      console.error('Error fetching real health interactions:', error);
      // Fallback to mock data on error
      return generateMockHealthInteractions();
    }
  },

  async fetchQuickScans(userId: string): Promise<QuickScanSession[]> {
    if (USE_MOCK_DATA) {
      const allInteractions = generateMockHealthInteractions();
      return allInteractions
        .filter(i => i.type === 'quick_scan')
        .map(i => i.data as QuickScanSession);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/health/quick-scans?user_id=${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch quick scans');
    }

    return response.json();
  },

  async fetchDeepDives(userId: string): Promise<DeepDiveSession[]> {
    if (USE_MOCK_DATA) {
      const allInteractions = generateMockHealthInteractions();
      return allInteractions
        .filter(i => i.type === 'deep_dive')
        .map(i => i.data as DeepDiveSession);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/health/deep-dives?user_id=${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch deep dives');
    }

    return response.json();
  },

  async fetchPhotoSessions(userId: string): Promise<PhotoSession[]> {
    if (USE_MOCK_DATA) {
      const allInteractions = generateMockHealthInteractions();
      return allInteractions
        .filter(i => i.type === 'photo_session')
        .map(i => i.data as PhotoSession);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/health/photo-sessions?user_id=${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch photo sessions');
    }

    return response.json();
  },

  // Fetch interactions for a specific time period (e.g., annual report)
  async fetchInteractionsByPeriod(
    userId: string,
    period: 'year' | 'month' | 'custom',
    customRange?: { start: Date; end: Date }
  ): Promise<HealthInteraction[]> {
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'custom':
        if (!customRange) throw new Error('Custom range required');
        startDate = customRange.start;
        endDate = customRange.end;
        break;
    }

    return this.fetchUserInteractions(userId, { startDate, endDate });
  },

  // Group interactions by month for timeline view
  groupInteractionsByMonth(interactions: HealthInteraction[]): Map<string, HealthInteraction[]> {
    const grouped = new Map<string, HealthInteraction[]>();
    
    interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(interaction);
    });

    // Sort by date within each month
    grouped.forEach((monthInteractions) => {
      monthInteractions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });

    return grouped;
  },

  // Get statistics for a user's health data
  async getUserHealthStats(userId: string): Promise<{
    totalInteractions: number;
    quickScans: number;
    deepDives: number;
    photoSessions: number;
    mostCommonSymptoms: string[];
    mostAffectedBodyParts: string[];
  }> {
    if (USE_MOCK_DATA) {
      return generateMockHealthStats();
    }

    const response = await fetch(
      `${API_BASE_URL}/api/health/stats?user_id=${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch health statistics');
    }

    return response.json();
  }
};