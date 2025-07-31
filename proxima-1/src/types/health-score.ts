export interface HealthScoreAction {
  icon: string;
  text: string;
}

export interface HealthScoreResponse {
  score: number;
  actions: HealthScoreAction[];
  reasoning?: string;
  generated_at: string;
  expires_at: string;
  cached: boolean;
}

export interface HealthScoreState {
  data: HealthScoreResponse | null;
  isLoading: boolean;
  error: string | null;
}