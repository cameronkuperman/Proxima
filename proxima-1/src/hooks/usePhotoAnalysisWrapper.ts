'use client';

import { isFeatureEnabled } from '@/config/features';
import { usePhotoAnalysis as usePhotoAnalysisOriginal } from './usePhotoAnalysis';
import { usePhotoAnalysisV2 } from './usePhotoAnalysisV2';

/**
 * Wrapper hook that chooses between original and optimized implementation
 * based on feature flag. This allows for gradual migration.
 */
export function usePhotoAnalysis() {
  const useOptimized = isFeatureEnabled('USE_SUPABASE_PHOTO_READS');
  
  // Use the new optimized version if feature is enabled
  if (useOptimized) {
    return usePhotoAnalysisV2();
  }
  
  // Fall back to original implementation
  return usePhotoAnalysisOriginal();
}

// Export the original hook with a different name for direct access if needed
export { usePhotoAnalysis as usePhotoAnalysisOriginal } from './usePhotoAnalysis';
export { usePhotoAnalysisV2 } from './usePhotoAnalysisV2';