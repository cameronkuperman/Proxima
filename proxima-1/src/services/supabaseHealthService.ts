import { supabase } from '@/lib/supabase';

export interface QuickScanRecord {
  id: string;
  user_id: string;
  body_part: string;
  form_data: {
    symptoms?: string;
    painLevel?: number;
    duration?: string;
    [key: string]: any;
  };
  analysis_result: {
    confidence: number;
    primaryCondition: string;
    likelihood: string;
    symptoms: string[];
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high';
    differentials: Array<{
      condition: string;
      probability: number;
    }>;
    redFlags: string[];
    selfCare: string[];
  };
  confidence_score: number;
  urgency_level: string;
  llm_summary?: string;
  created_at: string;
  escalated_to_oracle?: boolean;
  oracle_conversation_id?: string;
  physician_report_generated?: boolean;
}

export interface DeepDiveRecord {
  id: string;
  user_id: string;
  body_part: string;
  form_data: {
    symptoms?: string;
    [key: string]: any;
  };
  model_used: string;
  questions: Array<{
    question: string;
    answer: string;
    question_number: number;
  }>;
  current_step: number;
  internal_state?: any;
  status: 'active' | 'completed';
  created_at: string;
  completed_at?: string;
  final_analysis?: {
    confidence: number;
    primaryCondition: string;
    likelihood: string;
    symptoms: string[];
    recommendations: string[];
    urgency: 'low' | 'medium' | 'high';
    differentials: Array<{
      condition: string;
      probability: number;
    }>;
    redFlags: string[];
    selfCare: string[];
    reasoning_snippets: string[];
  };
  final_confidence?: number;
  reasoning_chain?: any[];
  tokens_used?: any;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  title: string;
  ai_provider: string;
  model_name: string;
  conversation_type: string;
  status: 'active' | 'completed' | 'archived' | 'deleted';
  message_count: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  metadata?: any;
  messages?: MessageRecord[];
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type: string;
  token_count: number;
  model_used?: string;
  processing_time?: number;
  attachments?: any[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface HealthDataSummary {
  quickScans: QuickScanRecord[];
  deepDives: DeepDiveRecord[];
  conversations: ConversationRecord[];
  timeRange: {
    start: string;
    end: string;
  };
  totalInteractions: number;
}

export const supabaseHealthService = {
  /**
   * Fetch all Quick Scans for a user with optional date filtering
   */
  async fetchQuickScans(
    userId: string, 
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<QuickScanRecord[]> {
    try {
      let query = supabase
        .from('quick_scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching quick scans:', error);
        throw new Error(`Failed to fetch quick scans: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchQuickScans:', error);
      return [];
    }
  },

  /**
   * Fetch all Deep Dive sessions for a user with optional date filtering
   */
  async fetchDeepDiveSessions(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: 'active' | 'completed';
      limit?: number;
    }
  ): Promise<DeepDiveRecord[]> {
    try {
      let query = supabase
        .from('deep_dive_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deep dive sessions:', error);
        throw new Error(`Failed to fetch deep dive sessions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchDeepDiveSessions:', error);
      return [];
    }
  },

  /**
   * Fetch user conversations with messages
   */
  async fetchUserConversations(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      includeMessages?: boolean;
      limit?: number;
    }
  ): Promise<ConversationRecord[]> {
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchUserConversations:', error);
      return [];
    }
  },

  /**
   * Get comprehensive health data summary for a user
   */
  async getHealthDataSummary(
    userId: string,
    timeRange?: {
      start: Date;
      end: Date;
    }
  ): Promise<HealthDataSummary> {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    
    const start = timeRange?.start || defaultStart;
    const end = timeRange?.end || now;

    const options = {
      startDate: start,
      endDate: end,
    };

    const [quickScans, deepDives, conversations] = await Promise.all([
      this.fetchQuickScans(userId, options),
      this.fetchDeepDiveSessions(userId, { ...options, status: 'completed' }),
      this.fetchUserConversations(userId, { ...options, includeMessages: false }),
    ]);

    return {
      quickScans,
      deepDives,
      conversations,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalInteractions: quickScans.length + deepDives.length + conversations.length,
    };
  },

  /**
   * Get Quick Scan by ID
   */
  async getQuickScanById(scanId: string): Promise<QuickScanRecord | null> {
    try {
      const { data, error } = await supabase
        .from('quick_scans')
        .select('*')
        .eq('id', scanId)
        .single();

      if (error) {
        console.error('Error fetching quick scan by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getQuickScanById:', error);
      return null;
    }
  },

  /**
   * Get Deep Dive session by ID
   */
  async getDeepDiveById(sessionId: string): Promise<DeepDiveRecord | null> {
    try {
      const { data, error } = await supabase
        .from('deep_dive_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching deep dive session by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getDeepDiveById:', error);
      return null;
    }
  },

  /**
   * Get conversation with messages by ID
   */
  async getConversationById(conversationId: string): Promise<ConversationRecord | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getConversationById:', error);
      return null;
    }
  },

  /**
   * Get health statistics for a user
   */
  async getHealthStats(userId: string): Promise<{
    totalQuickScans: number;
    totalDeepDives: number;
    totalConversations: number;
    mostCommonSymptoms: Array<{ symptom: string; count: number }>;
    mostAffectedBodyParts: Array<{ bodyPart: string; count: number }>;
    recentActivity: Array<{
      type: 'quick_scan' | 'deep_dive' | 'conversation';
      date: string;
      title: string;
    }>;
  }> {
    const summary = await this.getHealthDataSummary(userId);
    
    // Count symptoms
    const symptomCounts = new Map<string, number>();
    summary.quickScans.forEach(scan => {
      if (scan.analysis_result?.symptoms) {
        scan.analysis_result.symptoms.forEach(symptom => {
          symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1);
        });
      }
    });

    // Count body parts
    const bodyPartCounts = new Map<string, number>();
    [...summary.quickScans, ...summary.deepDives].forEach(item => {
      if (item.body_part) {
        bodyPartCounts.set(item.body_part, (bodyPartCounts.get(item.body_part) || 0) + 1);
      }
    });

    // Recent activity
    const recentActivity = [
      ...summary.quickScans.slice(0, 5).map(scan => ({
        type: 'quick_scan' as const,
        date: scan.created_at,
        title: `Quick Scan: ${scan.body_part}`,
      })),
      ...summary.deepDives.slice(0, 5).map(dive => ({
        type: 'deep_dive' as const,
        date: dive.created_at,
        title: `Deep Dive: ${dive.body_part}`,
      })),
      ...summary.conversations.slice(0, 5).map(conv => ({
        type: 'conversation' as const,
        date: conv.created_at,
        title: conv.title,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      totalQuickScans: summary.quickScans.length,
      totalDeepDives: summary.deepDives.length,
      totalConversations: summary.conversations.length,
      mostCommonSymptoms: Array.from(symptomCounts.entries())
        .map(([symptom, count]) => ({ symptom, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      mostAffectedBodyParts: Array.from(bodyPartCounts.entries())
        .map(([bodyPart, count]) => ({ bodyPart, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentActivity,
    };
  },
};