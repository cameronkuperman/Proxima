/**
 * Feature flags for gradual rollout of new features
 * These can be controlled via environment variables or user preferences
 */

export const featureFlags = {
  /**
   * Enable React Query + Supabase for photo analysis read operations
   * When true: Uses optimized Supabase queries with React Query caching
   * When false: Uses original backend API for all operations
   */
  USE_SUPABASE_PHOTO_READS: process.env.NEXT_PUBLIC_USE_SUPABASE_PHOTO_READS === 'true' || true, // Default to true
  
  /**
   * Show React Query DevTools in development
   */
  SHOW_QUERY_DEVTOOLS: process.env.NODE_ENV === 'development',
  
  /**
   * Enable real-time updates for photo sessions
   */
  ENABLE_REALTIME_PHOTOS: process.env.NEXT_PUBLIC_ENABLE_REALTIME_PHOTOS === 'true' || false,
  
  /**
   * Use optimized photo display with signed URLs
   */
  USE_SIGNED_PHOTO_URLS: process.env.NEXT_PUBLIC_USE_SIGNED_PHOTO_URLS === 'true' || true,
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] ?? false;
}