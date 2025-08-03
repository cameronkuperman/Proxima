import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface HealthInsight {
  id: string;
  user_id: string;
  story_id?: string | null;
  insight_type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  confidence: number;
  week_of: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface HealthPrediction {
  id: string;
  user_id: string;
  story_id?: string | null;
  event_description: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  reasoning?: string;
  suggested_actions?: string[];
  week_of: string;
  created_at: string;
}

interface ShadowPattern {
  id: string;
  user_id: string;
  pattern_name: string;
  pattern_category: 'symptom' | 'treatment' | 'wellness' | 'medication' | 'other';
  last_seen_description: string;
  significance: 'high' | 'medium' | 'low';
  last_mentioned_date?: string;
  days_missing: number;
  week_of: string;
  created_at: string;
}

interface StrategicMove {
  id: string;
  user_id: string;
  strategy: string;
  strategy_type: 'discovery' | 'pattern' | 'prevention' | 'optimization';
  priority: number;
  rationale?: string;
  expected_outcome?: string;
  week_of: string;
  created_at: string;
  completion_status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface GenerationStatus {
  insights: boolean;
  predictions: boolean;
  shadow_patterns: boolean;
  strategies: boolean;
  last_generated: string | null;
  refresh_limits?: {
    refreshes_used: number;
    refreshes_remaining: number;
    weekly_limit: number;
    resets_at: string;
  };
}

interface CacheInfo {
  insights?: string;
  predictions?: string;
  shadowPatterns?: string;
  strategies?: string;
}

// API Response interfaces according to the guide
interface IntelligenceResponse<T> {
  status: 'success' | 'partial' | 'cached' | 'error' | 'no_data';
  data: T[];
  count: number;
  error?: string;
  message?: string;
  metadata: {
    generated_at: string;
    week_of: string;
    cached: boolean;
    model_used?: string;
    generation_time_ms?: number;
    confidence_avg?: number;
    context_tokens?: number;
    comparison_period?: string;
    current_week_range?: string;
    analysis_period?: string;
    probability_avg?: number;
    priority_avg?: number;
    intelligence_sources?: {
      insights: number;
      predictions: number;
      shadow_patterns: number;
    };
  };
}

interface AllIntelligenceResponse {
  status: 'success' | 'partial' | 'cached' | 'error';
  data: {
    insights: HealthInsight[];
    shadow_patterns: ShadowPattern[];
    predictions: HealthPrediction[];
    strategies: StrategicMove[];
  };
  counts: {
    insights: number;
    shadow_patterns: number;
    predictions: number;
    strategies: number;
  };
  errors?: Record<string, string>;
  metadata: {
    generated_at: string;
    week_of: string;
    cached: boolean;
    generation_time_ms?: number;
    model_used?: string;
    component_timings?: {
      insights: number;
      shadow_patterns: number;
      predictions: number;
      strategies: number;
    };
  };
}

interface HealthIntelligence {
  insights: HealthInsight[];
  predictions: HealthPrediction[];
  shadowPatterns: ShadowPattern[];
  strategies: StrategicMove[];
  isLoading: boolean;
  isGenerating: boolean;
  generatingInsights: boolean;
  generatingPredictions: boolean;
  generatingShadowPatterns: boolean;
  generatingStrategies: boolean;
  weekOf: string;
  error: string | null;
  insightsError: string | null;
  predictionsError: string | null;
  patternsError: string | null;
  strategiesError: string | null;
  generationStatus: GenerationStatus;
  cacheInfo: CacheInfo;
  refreshLimits?: {
    refreshes_used: number;
    refreshes_remaining: number;
    weekly_limit: number;
    resets_at: string;
  };
  groupedShadowPatterns?: Record<string, ShadowPattern[]>;
}

// Helper function for authenticated API calls with comprehensive logging and retry
async function authenticatedFetch(url: string, options: RequestInit = {}, retries = 3) {
  console.log('🔒 Authenticated Fetch:', {
    url,
    method: options.method || 'GET',
    timestamp: new Date().toISOString()
  });

  // Get the current session token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Failed to get session:', sessionError);
    throw new Error('Authentication error: Please log in again');
  }

  if (!session) {
    console.error('❌ No active session found');
    throw new Error('Not authenticated: Please log in to access health intelligence');
  }

  console.log('🎫 Session found:', {
    userId: session.user.id,
    expiresAt: session.expires_at,
    tokenType: session.token_type
  });

  // Add auth headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  console.log('📤 Request details:', {
    url,
    method: options.method || 'GET',
    headers: {
      ...headers,
      'Authorization': 'Bearer [REDACTED]' // Don't log the actual token
    }
  });

  // Retry logic
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });

      console.log('📥 Response received:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        attempt
      });

      // Clone response to read body for logging
      const responseClone = response.clone();
      try {
        const responseData = await responseClone.text();
        console.log('📄 Response body:', responseData.substring(0, 500) + (responseData.length > 500 ? '...' : ''));
      } catch (e) {
        console.log('📄 Could not read response body');
      }

      // Don't retry on client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on 5xx errors and 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        if (attempt < retries) {
          console.log(`⏳ Retrying after ${delay}ms (attempt ${attempt}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`🚨 Fetch error (attempt ${attempt}/${retries}):`, {
        url,
        error: lastError.message,
        type: error instanceof TypeError ? 'Network/CORS error' : 'Other error'
      });
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  if (lastError instanceof TypeError) {
    throw new Error('Cannot connect to backend server. Please check if the API is running and CORS is configured correctly.');
  }
  
  throw lastError || new Error('Request failed after multiple attempts');
}

export function useHealthIntelligence() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [shadowPatterns, setShadowPatterns] = useState<ShadowPattern[]>([]);
  const [strategies, setStrategies] = useState<StrategicMove[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [generatingShadowPatterns, setGeneratingShadowPatterns] = useState(false);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  const [weekOf, setWeekOf] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [patternsError, setPatternsError] = useState<string | null>(null);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);
  // Initialize with default values to prevent null errors
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    insights: false,
    predictions: false,
    shadow_patterns: false,
    strategies: false,
    last_generated: null
  });
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({});
  const [refreshLimits, setRefreshLimits] = useState<{
    refreshes_used: number;
    refreshes_remaining: number;
    weekly_limit: number;
    resets_at: string;
  } | null>(null);
  const [groupedShadowPatterns, setGroupedShadowPatterns] = useState<Record<string, ShadowPattern[]>>({});

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Load all components on mount and generate if needed
    checkAndLoadHealthIntelligence();
  }, [user?.id]);

  const checkGenerationStatus = async (): Promise<GenerationStatus | null> => {
    if (!user?.id) return null;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      console.log('🔍 Checking generation status at:', `${API_URL}/api/health-intelligence/status/${user.id}`);
      
      const response = await authenticatedFetch(`${API_URL}/api/health-intelligence/status/${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Generation Status Data:', data);
        setGenerationStatus(data);
        return data;
      } else {
        const errorText = await response.text();
        console.error('❌ Status check failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error checking generation status:', error);
    }
    
    return null;
  };

  const checkAndLoadHealthIntelligence = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // First check generation status
    const status = await checkGenerationStatus();
    
    // Then load health intelligence
    await loadHealthIntelligence();
  };

  const loadHealthIntelligence = async () => {
    if (!user?.id) {
      // Set mock data for testing when no user
      console.log('⚠️ No user ID, using mock data');
      setInsights([
        {
          id: 'mock-1',
          user_id: 'mock-user',
          insight_type: 'positive',
          title: 'Sleep Quality Improved',
          description: 'Your sleep patterns show improvement this week',
          confidence: 85,
          week_of: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }
      ]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Starting Health Intelligence Load...');
    console.log('User ID:', user.id);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      console.log('API URL:', API_URL);
      
      // Fetch all components in parallel using the generate endpoints with no force_refresh
      console.log('📡 Fetching all components...');
      const [insightsRes, predictionsRes, patternsRes, strategiesRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/generate-insights/${user.id}`),
        authenticatedFetch(`${API_URL}/api/generate-predictions/${user.id}`),
        authenticatedFetch(`${API_URL}/api/generate-shadow-patterns/${user.id}`),
        authenticatedFetch(`${API_URL}/api/generate-strategies/${user.id}`)
      ]);

      const [insightsData, predictionsData, patternsData, strategiesData] = await Promise.all([
        insightsRes.json().then(data => {
          console.log('📊 Insights Data:', data);
          console.log('   Raw insights response:', JSON.stringify(data));
          return data;
        }),
        predictionsRes.json().then(data => {
          console.log('📊 Predictions Data:', data);
          console.log('   Raw predictions response:', JSON.stringify(data));
          return data;
        }),
        patternsRes.json().then(data => {
          console.log('📊 Shadow Patterns Data:', data);
          console.log('   Raw patterns response:', JSON.stringify(data));
          return data;
        }),
        strategiesRes.json().then(data => {
          console.log('📊 Strategies Data:', data);
          console.log('   Raw strategies response:', JSON.stringify(data));
          return data;
        })
      ]);

      // Set data with new response format handling according to API guide
      console.log('💾 Setting data to state...');
      
      // Update cache info
      const newCacheInfo: CacheInfo = {};
      
      // Handle insights - API guide format: { status, data: [...], count, metadata }
      if (insightsData.status === 'success' || insightsData.status === 'cached') {
        setInsights(insightsData.data || []);
        if (insightsData.metadata?.cached) {
          newCacheInfo.insights = insightsData.metadata.generated_at;
        }
      } else if (insightsData.status === 'no_data') {
        console.warn('⚠️ No insights data available');
        setInsights([]);
        setInsightsError('No health data available to generate insights');
      } else if (insightsData.status === 'error') {
        console.error('❌ Insights error:', insightsData.error);
        setInsights([]);
        setInsightsError(insightsData.error || 'Failed to generate insights');
      } else {
        // Fallback for old format
        console.warn('⚠️ Using fallback parsing for insights');
        setInsights(insightsData.insights || insightsData.data || []);
      }
      
      // Handle predictions
      if (predictionsData.status === 'success' || predictionsData.status === 'cached') {
        setPredictions(predictionsData.data || []);
        if (predictionsData.metadata?.cached) {
          newCacheInfo.predictions = predictionsData.metadata.generated_at;
        }
      } else if (predictionsData.status === 'no_data') {
        console.warn('⚠️ No predictions data available');
        setPredictions([]);
        setPredictionsError('Insufficient data for predictions');
      } else if (predictionsData.status === 'error') {
        console.error('❌ Predictions error:', predictionsData.error);
        setPredictions([]);
        setPredictionsError(predictionsData.error || 'Failed to generate predictions');
      } else {
        // Fallback for old format
        console.warn('⚠️ Using fallback parsing for predictions');
        setPredictions(predictionsData.predictions || predictionsData.data || []);
      }
      
      // Handle shadow patterns
      if (patternsData.status === 'success' || patternsData.status === 'cached') {
        setShadowPatterns(patternsData.data || []);
        if (patternsData.metadata?.cached) {
          newCacheInfo.shadowPatterns = patternsData.metadata.generated_at;
        }
      } else if (patternsData.status === 'no_data' || patternsData.count === 0) {
        console.warn('⚠️ No shadow patterns found');
        setShadowPatterns([]);
        // This is normal for new users
      } else if (patternsData.status === 'error') {
        console.error('❌ Shadow patterns error:', patternsData.error);
        setShadowPatterns([]);
        setPatternsError(patternsData.error || 'Failed to detect patterns');
      } else {
        // Fallback for old format
        console.warn('⚠️ Using fallback parsing for shadow patterns');
        setShadowPatterns(patternsData.shadow_patterns || patternsData.data || []);
      }
      
      // Handle strategies
      if (strategiesData.status === 'success' || strategiesData.status === 'cached') {
        setStrategies(strategiesData.data || []);
        if (strategiesData.metadata?.cached) {
          newCacheInfo.strategies = strategiesData.metadata.generated_at;
        }
      } else if (strategiesData.status === 'no_data') {
        console.warn('⚠️ No strategies data available');
        setStrategies([]);
        setStrategiesError('Need more data to generate strategies');
      } else if (strategiesData.status === 'error') {
        console.error('❌ Strategies error:', strategiesData.error);
        setStrategies([]);
        setStrategiesError(strategiesData.error || 'Failed to generate strategies');
      } else {
        // Fallback for old format
        console.warn('⚠️ Using fallback parsing for strategies');
        setStrategies(strategiesData.strategies || strategiesData.data || []);
      }
      
      setCacheInfo(newCacheInfo);
      
      // Set week of from metadata
      const weekDate = insightsData.metadata?.week_of || predictionsData.metadata?.week_of || 
                      patternsData.metadata?.week_of || strategiesData.metadata?.week_of;
      if (weekDate) {
        console.log('📅 Week Of:', weekDate);
        setWeekOf(weekDate);
      }

      // Check if we need to generate data
      const hasAnyData = 
        (insights.length > 0) ||
        (predictions.length > 0) ||
        (shadowPatterns.length > 0) ||
        (strategies.length > 0);

      console.log('📈 Data Status:', {
        hasInsights: insights.length > 0,
        hasPredictions: predictions.length > 0,
        hasShadowPatterns: shadowPatterns.length > 0,
        hasStrategies: strategies.length > 0,
        hasAnyData,
        insightsCount: insights.length,
        predictionsCount: predictions.length,
        patternsCount: shadowPatterns.length,
        strategiesCount: strategies.length
      });

      if (!hasAnyData) {
        console.log('⚠️ No data exists, generating all components...');
        await generateAllIntelligence();
      } else {
        console.log('✨ Data loaded successfully!');
        // Even if we have some data, check if insights or shadow patterns are empty
        if (insights.length === 0 && insightsData.status !== 'no_data') {
          console.log('📊 No insights found, generating...');
          await generateInsights();
        }
        if (shadowPatterns.length === 0 && patternsData.status !== 'no_data') {
          console.log('👻 No shadow patterns found, generating...');
          await generateShadowPatterns();
        }
      }
    } catch (error) {
      console.error('❌ Error loading health intelligence:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError('Cannot connect to backend server. Please check if the API is running.');
        console.error('🚨 Backend API is unreachable. CORS issue or server is down.');
      } else {
        setError('Failed to load health intelligence data');
      }
      // Don't try to generate on network errors
      if (!(error instanceof TypeError)) {
        console.log('🔄 Attempting to generate after error...');
        await generateAllIntelligence();
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 Health Intelligence load complete');
    }
  };

  // New focused generation functions
  const generateInsights = async (forceRefresh = false) => {
    if (!user?.id || generatingInsights) return;
    
    setGeneratingInsights(true);
    setInsightsError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const url = `${API_URL}/api/generate-insights/${user.id}${forceRefresh ? '?force_refresh=true' : ''}`;
      console.log('🚀 Generating insights:', url);
      
      const response = await authenticatedFetch(url, { method: 'POST' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate insights');
      }
      
      const data: IntelligenceResponse<HealthInsight> = await response.json();
      console.log('✅ Insights generated:', data);
      
      // Handle different response statuses according to API guide
      if (data.status === 'no_data') {
        setInsightsError('Start tracking your health to get insights');
        setInsights([]);
      } else if (data.status === 'error') {
        setInsightsError(data.error || data.message || 'Failed to generate insights');
        setInsights([]);
      } else if (data.status === 'success' || data.status === 'cached' || data.status === 'partial') {
        // Success statuses - set the data
        setInsights(data.data || []);
        
        // Update week of
        if (data.metadata?.week_of) {
          setWeekOf(data.metadata.week_of);
        }
        
        // Update cache info
        if (data.metadata?.cached) {
          setCacheInfo(prev => ({ ...prev, insights: data.metadata.generated_at }));
          console.log('Using cached insights from:', data.metadata.generated_at);
        }
        
        // Log metadata
        if (data.metadata) {
          console.log('Insights metadata:', {
            model: data.metadata.model_used,
            confidence_avg: data.metadata.confidence_avg,
            generation_time: data.metadata.generation_time_ms
          });
        }
      }
      
      // Update refresh limits if provided in metadata
      if ((data.metadata as any)?.refresh_limits) {
        setRefreshLimits((data.metadata as any).refresh_limits);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to generate insights');
      setInsights([]);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const generateShadowPatterns = async (forceRefresh = false) => {
    if (!user?.id || generatingShadowPatterns) return;
    
    setGeneratingShadowPatterns(true);
    setPatternsError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const url = `${API_URL}/api/generate-shadow-patterns/${user.id}${forceRefresh ? '?force_refresh=true' : ''}`;
      console.log('🚀 Generating shadow patterns:', url);
      
      const response = await authenticatedFetch(url, { method: 'POST' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate patterns');
      }
      
      const data: IntelligenceResponse<ShadowPattern> = await response.json();
      console.log('✅ Shadow patterns generated:', data);
      
      // Handle different response statuses according to API guide
      if (data.status === 'success' || data.status === 'cached') {
        setShadowPatterns(data.data || []);
        
        // Shadow patterns might be empty for new users - this is normal
        if (data.count === 0) {
          setPatternsError('Keep tracking - shadow patterns appear after 2+ weeks');
        } else {
          setPatternsError(null);
        }
        
        // Group patterns by category for better display
        const groupedPatterns = (data.data || []).reduce((acc: Record<string, ShadowPattern[]>, pattern: ShadowPattern) => {
          const category = pattern.pattern_category || 'other';
          if (!acc[category]) acc[category] = [];
          acc[category].push(pattern);
          return acc;
        }, {});
        
        setGroupedShadowPatterns(groupedPatterns);
        
        // Update week of
        if (data.metadata?.week_of) {
          setWeekOf(data.metadata.week_of);
        }
        
        // Update cache info
        if (data.metadata?.cached) {
          setCacheInfo(prev => ({ ...prev, shadowPatterns: data.metadata.generated_at }));
          console.log('Using cached shadow patterns from:', data.metadata.generated_at);
        }
      } else if (data.status === 'no_data') {
        setShadowPatterns([]);
        setPatternsError('No health data available for pattern detection');
      } else if (data.status === 'error') {
        setPatternsError(data.error || data.message || 'Pattern detection unavailable');
        setShadowPatterns([]);
      }
      
      // Update refresh limits if provided in metadata
      if ((data.metadata as any)?.refresh_limits) {
        setRefreshLimits((data.metadata as any).refresh_limits);
      }
    } catch (error) {
      console.error('Error generating shadow patterns:', error);
      setPatternsError(error instanceof Error ? error.message : 'Failed to generate patterns');
      setShadowPatterns([]);
    } finally {
      setGeneratingShadowPatterns(false);
    }
  };

  const generateAllIntelligence = async (forceRefresh = false) => {
    if (!user?.id || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    console.log('🚀 Using combined intelligence generation endpoint...');
    console.log('   Force Refresh:', forceRefresh);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const url = `${API_URL}/api/generate-all-intelligence/${user.id}${forceRefresh ? '?force_refresh=true' : ''}`;
      
      const response = await authenticatedFetch(url, { method: 'POST' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to generate intelligence');
      }
      
      const data: AllIntelligenceResponse = await response.json();
      console.log('✅ All intelligence generated:', data);
      
      // Handle different response statuses
      if (data.status === 'error') {
        setError((data.metadata as any)?.error || 'Failed to generate intelligence');
        return;
      }
      
      // Update all components with the new data
      if (data.data) {
        setInsights(data.data.insights || []);
        setShadowPatterns(data.data.shadow_patterns || []);
        setPredictions(data.data.predictions || []);
        setStrategies(data.data.strategies || []);
        
        // Update week of
        if (data.metadata?.week_of) {
          setWeekOf(data.metadata.week_of);
        }
        
        // Update cache info if data was cached
        if (data.metadata?.cached) {
          const cacheTime = data.metadata.generated_at;
          setCacheInfo({
            insights: cacheTime,
            predictions: cacheTime,
            shadowPatterns: cacheTime,
            strategies: cacheTime
          });
        }
      }
      
      // Handle partial success
      if (data.status === 'partial' && data.errors) {
        console.warn('Some intelligence components failed:', data.errors);
        // Set individual errors for failed components
        if (data.errors.insights) setInsightsError(data.errors.insights);
        if (data.errors.predictions) setPredictionsError(data.errors.predictions);
        if (data.errors.shadow_patterns) setPatternsError(data.errors.shadow_patterns);
        if (data.errors.strategies) setStrategiesError(data.errors.strategies);
      }
      
      // Update generation status
      await checkGenerationStatus();
      
    } catch (error) {
      console.error('❌ Error with combined intelligence generation:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate intelligence');
      
      // Fallback to individual generation
      console.log('🔄 Falling back to individual component generation...');
      await generateAllComponentsIndividually(forceRefresh);
    } finally {
      setIsGenerating(false);
      console.log('🏁 Generation complete');
    }
  };

  // Keep the old method as a fallback
  const generateAllComponentsIndividually = async (forceRefresh = false) => {
    if (!user?.id || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    console.log('🚀 Starting Individual Component Generation...');
    console.log('   Force Refresh:', forceRefresh);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      
      // Generate each component individually in sequence
      // First generate insights
      console.log('1️⃣ Generating Insights...');
      await generateInsights(forceRefresh);
      
      // Then generate predictions
      console.log('2️⃣ Generating Predictions...');
      const predictionsRes = await authenticatedFetch(`${API_URL}/api/generate-predictions/${user.id}?force_refresh=${forceRefresh}`, { method: 'POST' });
      
      if (predictionsRes.ok) {
        const predictionsData: IntelligenceResponse<HealthPrediction> = await predictionsRes.json();
        console.log('   Generated Predictions:', predictionsData);
        if (predictionsData.status === 'success' || predictionsData.status === 'cached') {
          setPredictions(predictionsData.data || []);
          if (predictionsData.metadata?.cached) {
            setCacheInfo(prev => ({ ...prev, predictions: predictionsData.metadata.generated_at }));
          }
        } else {
          console.warn('   ⚠️ Predictions generation failed:', predictionsData.status);
          setPredictions([]);
        }
      } else {
        console.error('   ❌ Failed to generate predictions:', await predictionsRes.text());
      }
      
      // Then generate shadow patterns
      console.log('3️⃣ Generating Shadow Patterns...');
      await generateShadowPatterns(forceRefresh);
      
      // Finally generate strategies (needs other components)
      console.log('4️⃣ Generating Strategies...');
      const strategiesRes = await authenticatedFetch(`${API_URL}/api/generate-strategies/${user.id}?force_refresh=${forceRefresh}`, { method: 'POST' });
      
      if (strategiesRes.ok) {
        const strategiesData: IntelligenceResponse<StrategicMove> = await strategiesRes.json();
        console.log('   Generated Strategies:', strategiesData);
        if (strategiesData.status === 'success' || strategiesData.status === 'cached') {
          setStrategies(strategiesData.data || []);
          if (strategiesData.metadata?.cached) {
            setCacheInfo(prev => ({ ...prev, strategies: strategiesData.metadata.generated_at }));
          }
        } else {
          console.warn('   ⚠️ Strategies generation failed:', strategiesData.status);
          setStrategies([]);
        }
      } else {
        console.error('   ❌ Failed to generate strategies:', await strategiesRes.text());
      }
      
      // Reload to get fresh data
      console.log('♻️ Reloading fresh data...');
      await loadHealthIntelligence();
    } catch (error) {
      console.error('❌ Error generating health intelligence:', error);
      setError('Failed to generate health intelligence data');
    } finally {
      setIsGenerating(false);
      console.log('🏁 Generation complete');
    }
  };

  const generateWeeklyAnalysis = async (options?: {
    forceRefresh?: boolean;
    includePredictions?: boolean;
    includePatterns?: boolean;
    includeStrategies?: boolean;
  }) => {
    if (!user?.id || isGenerating) return;
    
    const {
      forceRefresh = false,
      includePredictions = true,
      includePatterns = true,
      includeStrategies = true
    } = options || {};
    
    setIsGenerating(true);
    setError(null);
    
    console.log('📊 Generating Weekly Analysis...');
    console.log('   Options:', { forceRefresh, includePredictions, includePatterns, includeStrategies });
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      
      const response = await authenticatedFetch(`${API_URL}/api/generate-weekly-analysis`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          force_refresh: forceRefresh,
          include_predictions: includePredictions,
          include_patterns: includePatterns,
          include_strategies: includeStrategies
        })
      });
      
      console.log(`   Weekly Analysis Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   Generated Weekly Analysis:', data);
        
        // Reload all data
        await loadHealthIntelligence();
        
        // Update generation status
        await checkGenerationStatus();
      } else if (response.status === 429) {
        const errorData = await response.json();
        console.error('🚫 Rate limit reached:', errorData);
        if (errorData.detail?.refreshes_remaining !== undefined) {
          setError(`Refresh limit reached. ${errorData.detail.refreshes_remaining} refreshes left this week.`);
        } else {
          setError('Refresh limit reached. Please try again later.');
        }
        throw new Error('Rate limit exceeded');
      } else {
        const errorData = await response.text();
        throw new Error(`Failed to generate weekly analysis: ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Error generating weekly analysis:', error);
      setError('Failed to generate weekly analysis');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateComponent = async (component: 'insights' | 'predictions' | 'shadow-patterns' | 'strategies', forceRefresh = true) => {
    if (!user?.id || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    console.log(`🔄 Regenerating ${component} with force_refresh=${forceRefresh}...`);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const response = await authenticatedFetch(`${API_URL}/api/generate-${component}/${user.id}?force_refresh=${forceRefresh}`, { method: 'POST' });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Regenerated ${component}:`, data);
        
        // Update the specific component data based on API guide response format
        switch (component) {
          case 'insights':
            if (data.status === 'success' || data.status === 'cached') {
              setInsights(data.data || []);
              if (data.metadata?.cached) {
                setCacheInfo(prev => ({ ...prev, insights: data.metadata.generated_at }));
              }
            }
            break;
          case 'predictions':
            if (data.status === 'success' || data.status === 'cached') {
              setPredictions(data.data || []);
              if (data.metadata?.cached) {
                setCacheInfo(prev => ({ ...prev, predictions: data.metadata.generated_at }));
              }
            }
            break;
          case 'shadow-patterns':
            if (data.status === 'success' || data.status === 'cached') {
              setShadowPatterns(data.data || []);
              if (data.metadata?.cached) {
                setCacheInfo(prev => ({ ...prev, shadowPatterns: data.metadata.generated_at }));
              }
            }
            break;
          case 'strategies':
            if (data.status === 'success' || data.status === 'cached') {
              setStrategies(data.data || []);
              if (data.metadata?.cached) {
                setCacheInfo(prev => ({ ...prev, strategies: data.metadata.generated_at }));
              }
            }
            break;
        }
        
        // Refresh status
        await checkGenerationStatus();
      } else {
        throw new Error(`Failed to regenerate ${component}`);
      }
    } catch (error) {
      console.error(`❌ Error regenerating ${component}:`, error);
      setError(`Failed to regenerate ${component}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStrategyStatus = async (strategyId: string, status: 'completed' | 'pending') => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      
      console.log(`📝 Updating strategy ${strategyId} to ${status}`);
      
      const response = await authenticatedFetch(`${API_URL}/api/strategic-moves/${strategyId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          user_id: user?.id
        })
      });
      
      if (response.ok) {
        // Update local state
        setStrategies(prev => prev.map(s =>
          s.id === strategyId
            ? { ...s, completion_status: status }
            : s
        ));
        console.log(`✅ Strategy ${strategyId} marked as ${status}`);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update strategy:', errorText);
        throw new Error(`Failed to update strategy: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error updating strategy status:', error);
      throw error;
    }
  };

  return {
    insights,
    predictions,
    shadowPatterns,
    strategies,
    isLoading,
    isGenerating,
    generatingInsights,
    generatingPredictions,
    generatingShadowPatterns,
    generatingStrategies,
    weekOf,
    error,
    insightsError,
    predictionsError,
    patternsError,
    strategiesError,
    generationStatus,
    cacheInfo,
    refreshLimits,
    groupedShadowPatterns,
    refresh: loadHealthIntelligence,
    regenerateAll: generateAllIntelligence,
    regenerateComponent,
    generateWeeklyAnalysis,
    generateInsights,
    generateShadowPatterns,
    checkStatus: checkGenerationStatus,
    updateStrategyStatus
  };
}

// Legacy hooks for compatibility
export function useHealthAnalysis(weekOf?: string) {
  const { insights, predictions, shadowPatterns, strategies, isLoading, error } = useHealthIntelligence();
  
  return {
    data: {
      insights,
      predictions,
      shadow_patterns: shadowPatterns,
      strategies
    },
    isLoading,
    error
  };
}

export function useGenerateAnalysis() {
  const { regenerateAll, isGenerating, error } = useHealthIntelligence();
  
  return {
    generate: regenerateAll,
    isGenerating,
    error
  };
}

export function useExportPDF() {
  return {
    exportPDF: async () => null,
    isExporting: false,
    error: null
  };
}

export function useShareWithDoctor() {
  return {
    share: async () => null,
    isSharing: false,
    error: null
  };
}