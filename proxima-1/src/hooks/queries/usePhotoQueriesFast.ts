'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabasePhotoAnalysisServiceFast } from '@/services/supabasePhotoAnalysisServiceFast';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Fast query keys
export const photoQueryKeysFast = {
  sessions: (userId: string) => ['photo-fast', 'sessions', userId] as const,
  counts: (sessionIds: string[]) => ['photo-fast', 'counts', ...sessionIds] as const,
};

/**
 * ULTRA-FAST: Fetch sessions without counts for instant load
 * Counts are loaded in background after render
 */
export function usePhotoSessionsFast(includeSensitive: boolean = false, limit: number = 20) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Main query - just sessions, no counts
  const sessionsQuery = useQuery({
    queryKey: [...photoQueryKeysFast.sessions(user?.id || ''), includeSensitive, limit],
    queryFn: () => supabasePhotoAnalysisServiceFast.fetchPhotoSessionsFast(user!.id, includeSensitive, limit),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour - sessions rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache
    // Return stale data immediately while fetching
    placeholderData: (previousData) => previousData,
  });

  // Get session IDs for count loading
  const sessionIds = sessionsQuery.data?.map(s => s.id) || [];

  // Load counts in background (non-blocking)
  const countsQuery = useQuery({
    queryKey: photoQueryKeysFast.counts(sessionIds),
    queryFn: () => supabasePhotoAnalysisServiceFast.loadSessionCounts(sessionIds),
    enabled: sessionIds.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  // Update sessions with counts when available
  useEffect(() => {
    if (countsQuery.data && sessionsQuery.data) {
      const updatedSessions = sessionsQuery.data.map(session => {
        const counts = countsQuery.data.get(session.id);
        if (counts) {
          return {
            ...session,
            photo_count: counts.photo_count,
            analysis_count: counts.analysis_count
          };
        }
        return session;
      });

      // Update the query data with counts
      queryClient.setQueryData(
        [...photoQueryKeysFast.sessions(user?.id || ''), includeSensitive, limit],
        updatedSessions
      );
    }
  }, [countsQuery.data, sessionsQuery.data, queryClient, user?.id, includeSensitive, limit]);

  return {
    data: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    refetch: sessionsQuery.refetch,
    isFetching: sessionsQuery.isFetching,
    // Counts are still loading if counts query is fetching
    isLoadingCounts: countsQuery.isFetching,
  };
}