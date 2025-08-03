export interface HealthScoreAction {
  icon: string;
  text: string;
}

export interface HealthScoreResponse {
  score: number;
  previous_score: number | null;
  trend: 'up' | 'down' | 'same' | null;
  actions: HealthScoreAction[];
  reasoning?: string;
  generated_at: string;
  week_of: string;
  cached: boolean;
}

export interface HealthScoreState {
  data: HealthScoreResponse | null;
  isLoading: boolean;
  error: string | null;
}