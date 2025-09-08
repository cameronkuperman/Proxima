/**
 * Batched API Service - Combines multiple API calls into a single request
 * Implements request deduplication and caching
 */

import { supabase } from '@/lib/supabase';
import supabaseHealthScoreService from '@/services/supabaseHealthScoreService';
import supabaseAIPredictionsService from '@/services/supabaseAIPredictionsService';
import supabaseTrackingService from '@/services/supabaseTrackingService';

interface BatchedDashboardData {
  healthScore: any;
  predictions: any;
  tracking: any;
  reports?: any[];
  healthStory?: any;
}

interface CacheEntry {
  data: BatchedDashboardData;
  timestamp: number;
  userId: string;
}

// In-memory cache for batched requests
const batchCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map<string, Promise<BatchedDashboardData>>();

/**
 * Fetch all dashboard data in a single batched operation
 */
export async function fetchDashboardData(userId: string): Promise<BatchedDashboardData> {
  const cacheKey = `dashboard-${userId}`;
  
  // Check if we have a pending request
  if (pendingRequests.has(cacheKey)) {
    console.log('🔄 Deduplicating request - returning pending promise');
    return pendingRequests.get(cacheKey)!;
  }
  
  // Check cache
  const cached = batchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('⚡ Returning cached dashboard data');
    return cached.data;
  }
  
  // Create batched request
  const batchedPromise = performBatchedFetch(userId);
  
  // Store pending request for deduplication
  pendingRequests.set(cacheKey, batchedPromise);
  
  try {
    const result = await batchedPromise;
    
    // Cache the result
    batchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      userId
    });
    
    return result;
  } finally {
    // Clear pending request
    pendingRequests.delete(cacheKey);
  }
}

/**
 * Perform the actual batched fetch
 */
async function performBatchedFetch(userId: string): Promise<BatchedDashboardData> {
  console.log('🚀 Performing batched dashboard fetch');
  const startTime = performance.now();
  
  try {
    // Execute all requests in parallel
    const [healthScore, predictions, tracking, reports, healthStory] = await Promise.allSettled([
      // Health Score
      supabaseHealthScoreService.getCurrentHealthScore(userId),
      
      // AI Predictions
      supabaseAIPredictionsService.getCurrentPredictions(userId),
      
      // Tracking Dashboard
      supabaseTrackingService.getDashboard(userId),
      
      // Recent Reports (optional)
      fetchRecentReports(userId),
      
      // Latest Health Story (optional)
      fetchLatestHealthStory(userId)
    ]);
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ Batched fetch completed in ${totalTime.toFixed(2)}ms`);
    
    // Process results with fallbacks
    const result: BatchedDashboardData = {
      healthScore: healthScore.status === 'fulfilled' ? healthScore.value : null,
      predictions: predictions.status === 'fulfilled' ? predictions.value : null,
      tracking: tracking.status === 'fulfilled' ? tracking.value : null,
      reports: reports.status === 'fulfilled' ? reports.value : [],
      healthStory: healthStory.status === 'fulfilled' ? healthStory.value : null
    };
    
    // Log any failures
    if (healthScore.status === 'rejected') {
      console.warn('⚠️ Health score fetch failed:', healthScore.reason);
    }
    if (predictions.status === 'rejected') {
      console.warn('⚠️ Predictions fetch failed:', predictions.reason);
    }
    if (tracking.status === 'rejected') {
      console.warn('⚠️ Tracking fetch failed:', tracking.reason);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Batched fetch error:', error);
    throw error;
  }
}

/**
 * Fetch recent reports
 */
async function fetchRecentReports(userId: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Failed to fetch reports:', error);
    return [];
  }
}

/**
 * Fetch latest health story
 */
async function fetchLatestHealthStory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('health_stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
    return data;
  } catch (error) {
    console.warn('Failed to fetch health story:', error);
    return null;
  }
}

/**
 * Clear cache for a specific user
 */
export function clearDashboardCache(userId: string) {
  const cacheKey = `dashboard-${userId}`;
  batchCache.delete(cacheKey);
  console.log('🧹 Cleared dashboard cache for user');
}

/**
 * Prefetch dashboard data (for predictive loading)
 */
export async function prefetchDashboardData(userId: string) {
  // Only prefetch if not already cached
  const cacheKey = `dashboard-${userId}`;
  if (batchCache.has(cacheKey)) {
    return;
  }
  
  console.log('🔮 Prefetching dashboard data');
  // Fire and forget - don't await
  fetchDashboardData(userId).catch(err => {
    console.warn('Prefetch failed (silent):', err);
  });
}

/**
 * Get cache status
 */
export function getCacheStatus(userId: string) {
  const cacheKey = `dashboard-${userId}`;
  const cached = batchCache.get(cacheKey);
  
  if (!cached) {
    return { cached: false };
  }
  
  const age = Date.now() - cached.timestamp;
  const isStale = age > CACHE_DURATION;
  
  return {
    cached: true,
    age: Math.round(age / 1000), // in seconds
    isStale,
    remainingTTL: Math.max(0, CACHE_DURATION - age) / 1000 // in seconds
  };
}

// Clear old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of batchCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION * 2) {
      batchCache.delete(key);
      console.log(`🧹 Evicted stale cache entry: ${key}`);
    }
  }
}, 60 * 1000); // Run every minute

export default {
  fetchDashboardData,
  clearDashboardCache,
  prefetchDashboardData,
  getCacheStatus
};