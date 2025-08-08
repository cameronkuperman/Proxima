import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { HealthScoreResponse } from '@/types/health-score';
import supabaseHealthScoreService from '@/services/supabaseHealthScoreService';

interface UseHealthScoreReturn {
  scoreData: HealthScoreResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchHealthScore: (forceRefresh?: boolean) => Promise<void>;
  isRefreshing: boolean;
  isGenerating: boolean;
}

// Helper function for authenticated API calls
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  console.log('🏥 Health Score Fetch:', {
    url,
    method: options.method || 'GET',
    timestamp: new Date().toISOString()
  });

  // Get the current session token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Failed to get session:', sessionError);
    throw new Error('Authentication error');
  }

  if (!session) {
    console.error('❌ No active session found');
    throw new Error('Not authenticated');
  }

  console.log('🎫 Session found for health score');

  // Add auth headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log('📥 Health Score Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Clone response to read body for logging
    const responseClone = response.clone();
    try {
      const responseData = await responseClone.text();
      console.log('📄 Response body:', responseData.substring(0, 500) + (responseData.length > 500 ? '...' : ''));
    } catch (e) {
      console.log('📄 Could not read response body');
    }

    return response;
  } catch (error) {
    console.error('🚨 Health Score Fetch error:', {
      url,
      error: error instanceof Error ? error.message : error,
      type: error instanceof TypeError ? 'Network/CORS error' : 'Other error'
    });
    throw error;
  }
}

// In-memory cache for health scores (session-based)
const healthScoreCache = new Map<string, {
  data: HealthScoreResponse;
  timestamp: number;
  weekOf: string;
}>();

// LocalStorage key prefix
const STORAGE_KEY_PREFIX = 'health_score_';

// Cache duration - use the week_of field to determine if cache is still valid
const MEMORY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in memory

// Helper to get current week Monday
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// Helper to save to localStorage
function saveToStorage(userId: string, data: HealthScoreResponse) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      weekOf: data.week_of
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Failed to save health score to localStorage:', e);
  }
}

// Helper to load from localStorage
function loadFromStorage(userId: string): { data: HealthScoreResponse; timestamp: number; weekOf: string } | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Check if the stored score is for the current week
    const currentWeek = getCurrentWeekMonday();
    const storedWeek = new Date(parsed.weekOf).toISOString();
    
    // If stored data is from a different week, it's outdated
    if (new Date(storedWeek).getTime() < new Date(currentWeek).getTime()) {
      console.log('📅 Stored health score is from a previous week, will fetch new');
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed;
  } catch (e) {
    console.warn('Failed to load health score from localStorage:', e);
    return null;
  }
}

export function useHealthScore(): UseHealthScoreReturn {
  const { user } = useAuth();
  const [scoreData, setScoreData] = useState<HealthScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    if (user?.id) {
      // 1. Check in-memory cache first (fastest)
      const memCached = healthScoreCache.get(user.id);
      if (memCached && memCached.weekOf === memCached.data.week_of) {
        console.log('⚡ Using in-memory cached health score (instant)');
        setScoreData(memCached.data);
        setIsLoading(false);
        setError(null);
        return;
      }
      
      // 2. Check localStorage cache (persistent)
      const storageCached = loadFromStorage(user.id);
      if (storageCached) {
        console.log('💾 Using localStorage cached health score (instant)');
        setScoreData(storageCached.data);
        // Also populate memory cache
        healthScoreCache.set(user.id, storageCached);
        setIsLoading(false);
        setError(null);
        return;
      }
      
      // 3. Try Supabase cache (still faster than API)
      const supabaseCached = supabaseHealthScoreService.getCachedHealthScore(user.id);
      if (supabaseCached) {
        console.log('🗄️ Using Supabase cached health score');
        setScoreData({
          ...supabaseCached,
          generated_at: new Date().toISOString(),
          cached: true
        } as HealthScoreResponse);
        const cacheEntry = {
          data: {
            ...supabaseCached,
            generated_at: new Date().toISOString(),
            cached: true
          } as HealthScoreResponse,
          timestamp: Date.now(),
          weekOf: supabaseCached.week_of
        };
        healthScoreCache.set(user.id, cacheEntry);
        setIsLoading(false);
        setError(null);
        return;
      }
      
      // 4. No cache available, fetch from API
      fetchHealthScore();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchHealthScore = useCallback(async (forceRefresh = false) => {
    const startTime = performance.now();
    
    if (!user?.id) {
      console.warn('⚠️ No user ID available for health score');
      return;
    }

    // Prevent duplicate requests
    if (fetchInProgress.current && !forceRefresh) {
      console.log('⏳ Fetch already in progress, skipping...');
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      // Try memory cache
      const memCached = healthScoreCache.get(user.id);
      if (memCached && memCached.weekOf === memCached.data.week_of) {
        const loadTime = performance.now() - startTime;
        console.log(`⚡ In-memory cache hit! Loaded in ${loadTime.toFixed(2)}ms`);
        setScoreData(memCached.data);
        setIsLoading(false);
        setError(null);
        fetchInProgress.current = false;
        return;
      }
      
      // Try localStorage cache
      const storageCached = loadFromStorage(user.id);
      if (storageCached) {
        const loadTime = performance.now() - startTime;
        console.log(`💾 localStorage cache hit! Loaded in ${loadTime.toFixed(2)}ms`);
        setScoreData(storageCached.data);
        healthScoreCache.set(user.id, storageCached);
        setIsLoading(false);
        setError(null);
        fetchInProgress.current = false;
        return;
      }
      
      // Try Supabase directly (faster than backend API)
      console.log('🗄️ Fetching health score from Supabase...');
      const supabaseResult = await supabaseHealthScoreService.getCurrentHealthScore(user.id);
      
      if (supabaseResult.status === 'success' && supabaseResult.data) {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Supabase fetch successful! Loaded in ${loadTime.toFixed(2)}ms`);
        
        // Cache the result
        const cacheEntry = {
          data: {
            ...supabaseResult.data,
            generated_at: new Date().toISOString(),
            cached: false
          } as HealthScoreResponse,
          timestamp: Date.now(),
          weekOf: supabaseResult.data.week_of
        };
        healthScoreCache.set(user.id, cacheEntry);
        const enhancedData = {
          ...supabaseResult.data,
          generated_at: new Date().toISOString(),
          cached: false
        } as HealthScoreResponse;
        saveToStorage(user.id, enhancedData);
        supabaseHealthScoreService.cacheHealthScore(user.id, supabaseResult.data);
        
        setScoreData(enhancedData);
        setIsLoading(false);
        setError(null);
        fetchInProgress.current = false;
        return;
      } else if (supabaseResult.status === 'expired') {
        console.log('⏰ Health score expired, generating new one...');
        // Continue to backend API to generate new score
      }
    } else {
      // Force refresh - clear caches
      healthScoreCache.delete(user.id);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${user.id}`);
      console.log('🔄 Force refresh - cleared all caches');
    }

    fetchInProgress.current = true;

    // Set appropriate loading state
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    console.log('🔍 Fetching health score:', {
      userId: user.id,
      forceRefresh
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
      const url = forceRefresh 
        ? `${API_URL}/api/health-score/${user.id}?force_refresh=true`
        : `${API_URL}/api/health-score/${user.id}`;

      const response = await authenticatedFetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Health score fetch failed:', response.status, errorText);
        
        if (response.status === 404) {
          // Score doesn't exist - trigger generation
          console.log('🚀 No health score found, generating new score...');
          setIsGenerating(true);
          
          // Call the endpoint again which will generate a new score
          const generateResponse = await authenticatedFetch(url);
          
          if (generateResponse.ok) {
            const generatedData = await generateResponse.json();
            console.log('✅ Health score generated:', generatedData);
            
            // Cache the generated score
            const cacheEntry = {
              data: generatedData,
              timestamp: Date.now(),
              weekOf: generatedData.week_of
            };
            healthScoreCache.set(user.id, cacheEntry);
            saveToStorage(user.id, generatedData);
            
            setScoreData(generatedData);
            setError(null);
            setIsGenerating(false);
            return;
          } else {
            setIsGenerating(false);
            throw new Error('Failed to generate health score');
          }
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Failed to fetch health score: ${errorText}`);
        }
      }

      const data: HealthScoreResponse = await response.json();
      console.log('✅ Health score data:', data);

      // Validate the response structure
      if (typeof data.score !== 'number' || !Array.isArray(data.actions)) {
        console.error('❌ Invalid health score response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Validate actions have the required fields
      const validActions = data.actions.every(action => 
        typeof action.icon === 'string' && typeof action.text === 'string'
      );
      
      if (!validActions) {
        console.error('❌ Invalid action format in health score response');
        throw new Error('Invalid action format from server');
      }

      // Log week-over-week comparison if available
      if (data.previous_score !== null && data.trend) {
        const difference = data.score - data.previous_score;
        console.log(`📊 Week-over-week: ${data.previous_score} → ${data.score} (${data.trend} ${Math.abs(difference)} points)`);
      } else {
        console.log('📊 First week - no previous score for comparison');
      }

      // Cache the score for instant loading
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        weekOf: data.week_of
      };
      healthScoreCache.set(user.id, cacheEntry);
      saveToStorage(user.id, data);
      console.log('💾 Health score cached (memory + localStorage)');
      console.log('📅 Score valid for week of:', new Date(data.week_of).toLocaleDateString());
      
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ Total API fetch time: ${totalTime.toFixed(2)}ms`);

      setScoreData(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health score';
      console.error('❌ Error fetching health score:', errorMessage);
      setError(errorMessage);
      
      // Don't clear existing data on error if we're just refreshing
      if (!forceRefresh) {
        setScoreData(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      fetchInProgress.current = false;
    }
  }, [user?.id]);

  // Prefetch health score in the background after initial load
  useEffect(() => {
    if (user?.id && scoreData && !fetchInProgress.current) {
      // If we loaded from cache, do a background refresh to ensure data is fresh
      const lastFetch = healthScoreCache.get(user.id)?.timestamp;
      if (lastFetch && Date.now() - lastFetch > 5 * 60 * 1000) { // 5 minutes
        console.log('🔄 Background refresh of health score...');
        // Silent background fetch - don't show loading states
        const bgFetch = async () => {
          try {
            const API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
            const url = `${API_URL}/api/health-score/${user.id}`;
            const response = await authenticatedFetch(url);
            if (response.ok) {
              const freshData = await response.json();
              // Only update if week matches (don't override with old data)
              if (freshData.week_of === scoreData.week_of) {
                const cacheEntry = {
                  data: freshData,
                  timestamp: Date.now(),
                  weekOf: freshData.week_of
                };
                healthScoreCache.set(user.id, cacheEntry);
                saveToStorage(user.id, freshData);
                console.log('✅ Background refresh complete');
              }
            }
          } catch (e) {
            // Silent fail for background refresh
            console.log('Background refresh failed (silent):', e);
          }
        };
        bgFetch();
      }
    }
  }, [user?.id, scoreData]);

  // Pre-warm cache on mount if we have localStorage data
  useEffect(() => {
    if (user?.id && !healthScoreCache.has(user.id)) {
      const stored = loadFromStorage(user.id);
      if (stored) {
        healthScoreCache.set(user.id, stored);
        console.log('🔥 Pre-warmed memory cache from localStorage');
      }
    }
  }, [user?.id]);

  // Handle user logout - clear their specific cache
  useEffect(() => {
    return () => {
      // Only clear if user is logging out (no user.id)
      if (!user?.id && scoreData) {
        const previousUserId = Object.keys(localStorage)
          .find(key => key.startsWith(STORAGE_KEY_PREFIX));
        if (previousUserId) {
          const userId = previousUserId.replace(STORAGE_KEY_PREFIX, '');
          healthScoreCache.delete(userId);
          localStorage.removeItem(previousUserId);
          console.log('🧹 Cleared health score cache on logout');
        }
      }
    };
  }, [user?.id, scoreData]);

  return {
    scoreData,
    isLoading: isLoading || isGenerating,
    error,
    fetchHealthScore,
    isRefreshing,
    isGenerating
  };
}