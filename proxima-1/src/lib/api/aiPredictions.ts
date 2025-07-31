import {
  DashboardAlertResponse,
  PredictionsResponse,
  ImmediatePrediction,
  SeasonalPredictionsResponse,
  LongtermPredictionsResponse,
  BodyPatternsResponse,
  PatternQuestionsResponse,
  WeeklyPredictions
} from '@/types/aiPredictions';

const API_BASE = process.env.NEXT_PUBLIC_ORACLE_API_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 'https://web-production-945c4.up.railway.app';

// Helper function for API calls with error handling
async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    // Always return data, even if not ok - the backend returns structured errors
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export const aiPredictionsApi = {
  // Dashboard Alert - Single most important alert
  async getDashboardAlert(
    userId: string,
    forceRefresh = false
  ): Promise<DashboardAlertResponse> {
    const url = new URL(`${API_BASE}/api/ai/dashboard-alert/${userId}`);
    if (forceRefresh) url.searchParams.append('force_refresh', 'true');
    
    return fetchWithErrorHandling<DashboardAlertResponse>(url.toString());
  },

  // Immediate Predictions - Next 7 days
  async getImmediatePredictions(
    userId: string,
    forceRefresh = false
  ): Promise<PredictionsResponse<ImmediatePrediction>> {
    const url = new URL(`${API_BASE}/api/ai/predictions/immediate/${userId}`);
    if (forceRefresh) url.searchParams.append('force_refresh', 'true');
    
    return fetchWithErrorHandling<PredictionsResponse<ImmediatePrediction>>(url.toString());
  },

  // Seasonal Predictions - Next 3 months
  async getSeasonalPredictions(
    userId: string,
    forceRefresh = false
  ): Promise<SeasonalPredictionsResponse> {
    const url = new URL(`${API_BASE}/api/ai/predictions/seasonal/${userId}`);
    if (forceRefresh) url.searchParams.append('force_refresh', 'true');
    
    return fetchWithErrorHandling<SeasonalPredictionsResponse>(url.toString());
  },

  // Long-term Trajectory - Health assessments
  async getLongtermPredictions(
    userId: string,
    forceRefresh = false
  ): Promise<LongtermPredictionsResponse> {
    const url = new URL(`${API_BASE}/api/ai/predictions/longterm/${userId}`);
    if (forceRefresh) url.searchParams.append('force_refresh', 'true');
    
    return fetchWithErrorHandling<LongtermPredictionsResponse>(url.toString());
  },

  // Body Patterns - Tendencies and positive responses
  async getBodyPatterns(
    userId: string,
    forceRefresh = false
  ): Promise<BodyPatternsResponse> {
    const url = new URL(`${API_BASE}/api/ai/patterns/${userId}`);
    if (forceRefresh) url.searchParams.append('force_refresh', 'true');
    
    return fetchWithErrorHandling<BodyPatternsResponse>(url.toString());
  },

  // Pattern Questions - User's pattern questions
  async getPatternQuestions(
    userId: string,
    forceRefresh = false
  ): Promise<PatternQuestionsResponse> {
    const url = new URL(`${API_BASE}/api/ai/questions/${userId}`);
    if (forceRefresh) url.searchParams.append('force_refresh', 'true');
    
    return fetchWithErrorHandling<PatternQuestionsResponse>(url.toString());
  },

  // Weekly Bundle - Get all predictions at once (legacy support)
  async getWeeklyPredictions(userId: string): Promise<{
    status: string;
    predictions?: WeeklyPredictions;
    message?: string;
  }> {
    return fetchWithErrorHandling(`${API_BASE}/api/ai/weekly/${userId}`);
  },

  // Trigger weekly generation
  async generateWeekly(userId: string): Promise<{
    status: string;
    prediction_id?: string;
    message: string;
  }> {
    return fetchWithErrorHandling(
      `${API_BASE}/api/ai/generate-weekly/${userId}`,
      { method: 'POST' }
    );
  },

  // Generate initial predictions
  async generateInitial(userId: string): Promise<{
    status: string;
    message?: string;
  }> {
    return fetchWithErrorHandling(
      `${API_BASE}/api/ai/generate-initial/${userId}`,
      { method: 'POST' }
    );
  },

  // Regenerate predictions
  async regeneratePredictions(userId: string): Promise<{
    status: string;
    message?: string;
  }> {
    return fetchWithErrorHandling(
      `${API_BASE}/api/ai/regenerate/${userId}`,
      { method: 'POST' }
    );
  }
};

// Cache management utilities
export const aiPredictionCache = {
  // Cache key generators
  keys: {
    dashboardAlert: (userId: string) => `ai-alert-${userId}`,
    immediatePredictions: (userId: string) => `ai-immediate-${userId}`,
    seasonalPredictions: (userId: string) => `ai-seasonal-${userId}`,
    longtermPredictions: (userId: string) => `ai-longterm-${userId}`,
    bodyPatterns: (userId: string) => `ai-patterns-${userId}`,
    patternQuestions: (userId: string) => `ai-questions-${userId}`,
  },

  // Get cached data with expiry check
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, expiresAt } = JSON.parse(cached);
      if (new Date(expiresAt) < new Date()) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  // Set cached data with expiry
  set<T>(key: string, data: T, ttlMinutes = 5): void {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      localStorage.setItem(key, JSON.stringify({
        data,
        expiresAt: expiresAt.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  },

  // Clear specific cache
  clear(key: string): void {
    localStorage.removeItem(key);
  },

  // Clear all AI prediction caches for a user
  clearAll(userId: string): void {
    Object.values(this.keys).forEach(keyGen => {
      this.clear(keyGen(userId));
    });
  }
};