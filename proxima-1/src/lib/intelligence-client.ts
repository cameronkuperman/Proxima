import { supabase } from '@/lib/supabase';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

// TypeScript interfaces matching backend structures
export interface WeeklyHealthBrief {
  id: string;
  user_id: string;
  week_of: string; // Monday of the week
  
  greeting: {
    title: string;
    subtitle: string;
    readTime: string;
    generatedAt: Date;
  };
  
  main_story: {
    headline: string;
    narrative: string;
    
    weekHighlights: Array<{
      day: string;
      event: string;
      impact: 'positive' | 'trigger' | 'symptom';
      detail: string;
    }>;
    
    inlineInsights: Array<{
      triggerText: string;
      expansion: string;
    }>;
  };
  
  discoveries: {
    primaryPattern: {
      title: string;
      description: string;
      confidence: number; // 0-1
      evidence: string;
    };
    
    secondaryPatterns: Array<{
      pattern: string;
      frequency: string;
      actionable: boolean;
    }>;
    
    comparisonToLastWeek: {
      overall: string;
      wins: string[];
      challenges: string[];
    };
  };
  
  experiments: {
    title: string;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      experiment: string;
      rationale: string;
      howTo: string;
      trackingMetric: string;
    }>;
    weeklyChecklist: Array<{
      id: string;
      task: string;
      completed: boolean;
    }>;
  };
  
  spotlight: {
    title: string;
    content: string;
    learnMore: {
      teaser: string;
      fullContent: string;
    };
  };
  
  week_stats: {
    symptomFreeDays: number;
    bestDay: string;
    worstDay: string;
    trendsUp: string[];
    trendsDown: string[];
    aiConsultations: number;
    photosAnalyzed: number;
  };
  
  looking_ahead: {
    prediction: string;
    watchFor: string;
    encouragement: string;
  };
  
  created_at: Date;
  last_opened_at?: Date;
}

export interface HealthVelocityData {
  score: number; // 0-100
  trend: 'improving' | 'declining' | 'stable';
  momentum: number; // % change from last period
  sparkline: number[]; // Last 7 data points
  recommendations: Array<{
    action: string;
    impact: string; // "+8 points"
    icon: string; // Empty string per spec
  }>;
}

export interface SystemHealth {
  health: number; // 0-100
  issues: string[];
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

export interface BodySystemsData {
  head: SystemHealth;
  chest: SystemHealth;
  digestive: SystemHealth;
  arms: SystemHealth;
  legs: SystemHealth;
  skin: SystemHealth;
  mental: SystemHealth;
}

export interface TimelineData {
  timeRange: string;
  dataPoints: Array<{
    date: string;
    severity: number; // 0-10
    symptom: string;
    notes?: string;
  }>;
  aiConsultations: Array<{
    id: string;
    date: string;
    type: 'quick_scan' | 'deep_dive';
    bodyPart: string;
    severity: string;
  }>;
  photoSessions: Array<{
    id: string;
    date: string;
    photoCount: number;
    improvement?: number;
    bodyPart: string;
  }>;
  doctorRecommendations: Array<{
    date: string;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  }>;
}

export interface PatternCard {
  id: string;
  type: 'correlation' | 'prediction' | 'success' | 'environmental' | 'behavioral';
  priority: 'high' | 'medium' | 'low';
  
  front: {
    icon: string; // Empty string
    headline: string;
    confidence: number; // 0-100
    dataPoints: number;
    actionable: boolean;
  };
  
  back: {
    fullInsight: string;
    visualization: 'timeline' | 'correlation' | 'comparison' | 'chart';
    actions: Array<{
      text: string;
      type: 'primary' | 'secondary';
    }>;
    explanation: string;
  };
}

export interface DoctorReadinessData {
  score: number; // 0-100
  missingData: string[];
  availableData: {
    symptoms: boolean;
    timeline: boolean;
    patterns: boolean;
    photos: boolean;
    aiAnalysis: boolean;
    medications: boolean;
    vitals: boolean;
  };
  reportSections: string[];
}

export interface ComparativeIntelligence {
  similarUsers: number;
  patterns: Array<{
    pattern: string;
    affectedUsers: number;
    successfulInterventions: Array<{
      action: string;
      successRate: number;
      triedBy: number;
      description: string;
    }>;
  }>;
  topRecommendation: string;
}

// Helper to get current week's Monday
export function getCurrentWeekMonday(): string {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

// Intelligence API Client
export class IntelligenceClient {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = API_URL;
  }
  
  // Log all API calls for debugging
  private logApiCall(endpoint: string, data?: any, error?: any) {
    if (error) {
      console.error(`[Intelligence API] Error calling ${endpoint}:`, error);
      console.error(`[Intelligence API] Request data:`, data);
    } else {
      console.log(`[Intelligence API] Called ${endpoint}`, data ? 'with data:' : '', data || '');
    }
  }
  
  // ===== Weekly Brief Methods =====
  
  /**
   * Fetch current week's brief from Supabase
   */
  async fetchWeeklyBrief(userId: string): Promise<WeeklyHealthBrief | null> {
    try {
      const weekOf = getCurrentWeekMonday();
      
      // First try to get from Supabase
      const { data, error } = await supabase
        .from('weekly_health_briefs')
        .select('*')
        .eq('user_id', userId)
        .eq('week_of', weekOf)
        .single();
      
      if (error) {
        this.logApiCall('fetchWeeklyBrief', { userId, weekOf }, error);
        
        // If no brief for current week, try previous week
        if (error.code === 'PGRST116') { // No rows returned
          return this.fetchPreviousWeekBrief(userId);
        }
        return null;
      }
      
      this.logApiCall('fetchWeeklyBrief', { userId, weekOf, found: true });
      return this.transformBriefFromDb(data);
    } catch (error) {
      this.logApiCall('fetchWeeklyBrief', { userId }, error);
      return null;
    }
  }
  
  /**
   * Fetch previous week's brief as fallback
   */
  async fetchPreviousWeekBrief(userId: string): Promise<WeeklyHealthBrief | null> {
    try {
      const { data, error } = await supabase
        .from('weekly_health_briefs')
        .select('*')
        .eq('user_id', userId)
        .order('week_of', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        this.logApiCall('fetchPreviousWeekBrief', { userId }, error);
        return null;
      }
      
      this.logApiCall('fetchPreviousWeekBrief', { userId, weekOf: data.week_of });
      return this.transformBriefFromDb(data);
    } catch (error) {
      this.logApiCall('fetchPreviousWeekBrief', { userId }, error);
      return null;
    }
  }
  
  /**
   * Mark brief as opened/read
   */
  async markBriefAsOpened(briefId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('weekly_health_briefs')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('id', briefId);
      
      if (error) {
        this.logApiCall('markBriefAsOpened', { briefId }, error);
        return false;
      }
      
      this.logApiCall('markBriefAsOpened', { briefId, success: true });
      return true;
    } catch (error) {
      this.logApiCall('markBriefAsOpened', { briefId }, error);
      return false;
    }
  }
  
  /**
   * Transform database brief to frontend format
   */
  private transformBriefFromDb(data: any): WeeklyHealthBrief {
    return {
      id: data.id,
      user_id: data.user_id,
      week_of: data.week_of,
      greeting: data.greeting,
      main_story: data.main_story,
      discoveries: data.discoveries,
      experiments: data.experiments,
      spotlight: data.spotlight,
      week_stats: data.week_stats,
      looking_ahead: data.looking_ahead,
      created_at: new Date(data.created_at),
      last_opened_at: data.last_opened_at ? new Date(data.last_opened_at) : undefined
    };
  }
  
  // ===== Data View Intelligence Methods =====
  
  /**
   * Fetch Health Velocity data
   */
  async fetchHealthVelocity(userId: string, timeRange = '7D'): Promise<HealthVelocityData | null> {
    try {
      // Try cache first
      const cached = await this.getCachedData(userId, `velocity_${timeRange}`);
      if (cached) return cached as HealthVelocityData;
      
      // Try Railway API endpoint
      const response = await fetch(`${this.apiUrl}/api/intelligence/health-velocity/${userId}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        this.logApiCall('fetchHealthVelocity', { userId, timeRange }, `HTTP ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      this.logApiCall('fetchHealthVelocity', { userId, timeRange, success: true });
      
      // Cache the result
      await this.cacheData(userId, `velocity_${timeRange}`, data);
      
      return data;
    } catch (error) {
      this.logApiCall('fetchHealthVelocity', { userId, timeRange }, error);
      return null;
    }
  }
  
  /**
   * Fetch Body Systems data
   */
  async fetchBodySystems(userId: string): Promise<BodySystemsData | null> {
    try {
      // Try cache first
      const cached = await this.getCachedData(userId, 'body_systems');
      if (cached) return cached as BodySystemsData;
      
      // Try Railway API endpoint
      const response = await fetch(`${this.apiUrl}/api/intelligence/body-systems/${userId}`);
      
      if (!response.ok) {
        this.logApiCall('fetchBodySystems', { userId }, `HTTP ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      this.logApiCall('fetchBodySystems', { userId, success: true });
      
      // Cache the result
      await this.cacheData(userId, 'body_systems', data);
      
      return data;
    } catch (error) {
      this.logApiCall('fetchBodySystems', { userId }, error);
      return null;
    }
  }
  
  /**
   * Fetch Timeline data
   */
  async fetchTimeline(userId: string, timeRange = '30D'): Promise<TimelineData | null> {
    try {
      // Try cache first
      const cached = await this.getCachedData(userId, `timeline_${timeRange}`);
      if (cached) return cached as TimelineData;
      
      // Try Railway API endpoint
      const response = await fetch(`${this.apiUrl}/api/intelligence/timeline/${userId}?timeRange=${timeRange}`);
      
      if (!response.ok) {
        this.logApiCall('fetchTimeline', { userId, timeRange }, `HTTP ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      this.logApiCall('fetchTimeline', { userId, timeRange, success: true });
      
      // Cache the result
      await this.cacheData(userId, `timeline_${timeRange}`, data);
      
      return data;
    } catch (error) {
      this.logApiCall('fetchTimeline', { userId, timeRange }, error);
      return null;
    }
  }
  
  /**
   * Fetch Pattern Discovery cards
   */
  async fetchPatterns(userId: string, limit = 10): Promise<PatternCard[]> {
    try {
      // Try cache first
      const cached = await this.getCachedData(userId, 'patterns');
      if (cached) return cached as PatternCard[];
      
      // Try Railway API endpoint
      const response = await fetch(`${this.apiUrl}/api/intelligence/patterns/${userId}?limit=${limit}`);
      
      if (!response.ok) {
        this.logApiCall('fetchPatterns', { userId, limit }, `HTTP ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      this.logApiCall('fetchPatterns', { userId, limit, count: data.length });
      
      // Cache the result
      await this.cacheData(userId, 'patterns', data);
      
      return data;
    } catch (error) {
      this.logApiCall('fetchPatterns', { userId, limit }, error);
      return [];
    }
  }
  
  /**
   * Fetch Doctor Readiness score
   */
  async fetchDoctorReadiness(userId: string): Promise<DoctorReadinessData | null> {
    try {
      // Try cache first
      const cached = await this.getCachedData(userId, 'doctor_readiness');
      if (cached) return cached as DoctorReadinessData;
      
      // Try Railway API endpoint
      const response = await fetch(`${this.apiUrl}/api/intelligence/doctor-readiness/${userId}`);
      
      if (!response.ok) {
        this.logApiCall('fetchDoctorReadiness', { userId }, `HTTP ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      this.logApiCall('fetchDoctorReadiness', { userId, score: data.score });
      
      // Cache the result
      await this.cacheData(userId, 'doctor_readiness', data);
      
      return data;
    } catch (error) {
      this.logApiCall('fetchDoctorReadiness', { userId }, error);
      return null;
    }
  }
  
  /**
   * Fetch Comparative Intelligence
   */
  async fetchComparativeIntelligence(userId: string, patternLimit = 5): Promise<ComparativeIntelligence | null> {
    try {
      // Try cache first
      const cached = await this.getCachedData(userId, 'comparative');
      if (cached) return cached as ComparativeIntelligence;
      
      // Try Railway API endpoint
      const response = await fetch(`${this.apiUrl}/api/intelligence/comparative/${userId}?patternLimit=${patternLimit}`);
      
      if (!response.ok) {
        this.logApiCall('fetchComparativeIntelligence', { userId, patternLimit }, `HTTP ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      this.logApiCall('fetchComparativeIntelligence', { userId, similarUsers: data.similarUsers });
      
      // Cache the result
      await this.cacheData(userId, 'comparative', data);
      
      return data;
    } catch (error) {
      this.logApiCall('fetchComparativeIntelligence', { userId, patternLimit }, error);
      return null;
    }
  }
  
  // ===== Cache Management =====
  
  /**
   * Get cached data from Supabase intelligence_cache table
   */
  private async getCachedData(userId: string, cacheKey: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('intelligence_cache')
        .select('data, expires_at')
        .eq('user_id', userId)
        .eq('cache_key', cacheKey)
        .single();
      
      if (error || !data) return null;
      
      // Check if cache is expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        console.log(`[Intelligence Cache] Cache expired for ${cacheKey}`);
        return null;
      }
      
      console.log(`[Intelligence Cache] Cache hit for ${cacheKey}`);
      return data.data;
    } catch (error) {
      console.error(`[Intelligence Cache] Error getting cache for ${cacheKey}:`, error);
      return null;
    }
  }
  
  /**
   * Store data in Supabase intelligence_cache table
   */
  private async cacheData(userId: string, cacheKey: string, data: any): Promise<void> {
    try {
      // Set expiration based on cache key
      const expirationHours = this.getCacheExpiration(cacheKey);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
      
      await supabase
        .from('intelligence_cache')
        .upsert({
          user_id: userId,
          cache_key: cacheKey,
          data: data,
          generated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        });
      
      console.log(`[Intelligence Cache] Cached ${cacheKey} for ${expirationHours} hours`);
    } catch (error) {
      console.error(`[Intelligence Cache] Error caching ${cacheKey}:`, error);
    }
  }
  
  /**
   * Get cache expiration time in hours based on data type
   */
  private getCacheExpiration(cacheKey: string): number {
    if (cacheKey.includes('brief')) return 24; // Weekly brief: 24 hours
    if (cacheKey.includes('velocity')) return 1; // Health velocity: 1 hour
    if (cacheKey.includes('body_systems')) return 1; // Body systems: 1 hour
    if (cacheKey.includes('timeline')) return 0.5; // Timeline: 30 minutes
    if (cacheKey.includes('patterns')) return 6; // Patterns: 6 hours
    if (cacheKey.includes('doctor')) return 1; // Doctor readiness: 1 hour
    if (cacheKey.includes('comparative')) return 12; // Comparative: 12 hours
    return 1; // Default: 1 hour
  }
  
  /**
   * Clear all cached data for a user
   */
  async clearCache(userId: string): Promise<void> {
    try {
      await supabase
        .from('intelligence_cache')
        .delete()
        .eq('user_id', userId);
      
      console.log(`[Intelligence Cache] Cleared all cache for user ${userId}`);
    } catch (error) {
      console.error(`[Intelligence Cache] Error clearing cache:`, error);
    }
  }
}

// Export singleton instance
export const intelligenceClient = new IntelligenceClient();