// Health Intelligence API Client
const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export interface HealthInsight {
  id: string;
  insight_type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  confidence: number;
}

export interface HealthPrediction {
  id: string;
  event_description: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  reasoning?: string;
}

export interface ShadowPattern {
  id: string;
  pattern_name: string;
  last_seen_description: string;
  significance: 'high' | 'medium' | 'low';
  last_mentioned_date?: string;
}

export interface HealthStrategy {
  id: string;
  strategy: string;
  strategy_type: 'discovery' | 'pattern' | 'prevention';
  priority?: number;
}

export interface HealthAnalysisResponse {
  insights: HealthInsight[];
  predictions: HealthPrediction[];
  shadow_patterns: ShadowPattern[];
  strategies: HealthStrategy[];
  week_of: string;
}

export class HealthIntelligenceAPI {
  private baseUrl = API_URL;

  async generateWeeklyAnalysis(userId: string, forceRefresh = false) {
    const response = await fetch(`${this.baseUrl}/api/generate-weekly-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        force_refresh: forceRefresh,
        include_predictions: true,
        include_patterns: true,
        include_strategies: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Analysis generation failed');
    }

    return response.json();
  }

  async getAnalysis(userId: string, weekOf?: string): Promise<HealthAnalysisResponse> {
    const url = weekOf 
      ? `${this.baseUrl}/api/health-analysis/${userId}?week_of=${weekOf}`
      : `${this.baseUrl}/api/health-analysis/${userId}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch health analysis');
    }
    
    return response.json();
  }

  async exportPDF(userId: string, storyIds: string[], options?: {
    includeAnalysis?: boolean;
    includeNotes?: boolean;
  }) {
    const response = await fetch(`${this.baseUrl}/api/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        story_ids: storyIds,
        include_analysis: options?.includeAnalysis ?? true,
        include_notes: options?.includeNotes ?? true
      })
    });

    if (!response.ok) {
      throw new Error('PDF export failed');
    }

    const data = await response.json();
    return data;
  }

  async shareWithDoctor(userId: string, storyIds: string[], options?: {
    recipientEmail?: string;
    expiresInDays?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/api/share-with-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        story_ids: storyIds,
        recipient_email: options?.recipientEmail,
        expires_in_days: options?.expiresInDays || 30
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    return response.json();
  }
}

export const healthIntelligenceAPI = new HealthIntelligenceAPI();