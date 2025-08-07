'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabasePhotoAnalysisService } from '@/services/supabasePhotoAnalysisService';
import { useAuth } from '@/contexts/AuthContext';

// Query keys factory for better organization
export const photoQueryKeys = {
  all: ['photo'] as const,
  sessions: (userId: string) => [...photoQueryKeys.all, 'sessions', userId] as const,
  sessionDetails: (sessionId: string) => [...photoQueryKeys.all, 'session', sessionId] as const,
  sessionPhotos: (sessionId: string) => [...photoQueryKeys.all, 'photos', sessionId] as const,
  photoUrl: (photoPath: string) => [...photoQueryKeys.all, 'url', photoPath] as const,
  analyses: (sessionId: string) => [...photoQueryKeys.all, 'analyses', sessionId] as const,
  analysisHistory: (sessionId: string) => [...photoQueryKeys.all, 'history', sessionId] as const,
  progression: (sessionId: string) => [...photoQueryKeys.all, 'progression', sessionId] as const,
  timeline: (sessionId: string) => [...photoQueryKeys.all, 'timeline', sessionId] as const,
  reminders: (sessionId?: string) => [...photoQueryKeys.all, 'reminders', sessionId || 'all'] as const,
};

/**
 * Fetch all photo sessions for the current user
 * Cache for 5 minutes
 */
export function usePhotoSessions(includeSensitive: boolean = false) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: photoQueryKeys.sessions(user?.id || ''),
    queryFn: () => supabasePhotoAnalysisService.fetchPhotoSessions(user!.id, includeSensitive),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get details for a specific session
 * Cache for 2 minutes
 */
export function useSessionDetails(sessionId: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.sessionDetails(sessionId || ''),
    queryFn: () => supabasePhotoAnalysisService.getSessionById(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get photos for a session
 * Cache for 5 minutes
 */
export function useSessionPhotos(sessionId: string | null, excludeSensitive: boolean = true) {
  return useQuery({
    queryKey: [...photoQueryKeys.sessionPhotos(sessionId || ''), excludeSensitive],
    queryFn: () => supabasePhotoAnalysisService.getSessionPhotos(sessionId!, excludeSensitive),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get signed URL for a photo
 * Cache for 50 minutes (URLs expire in 60)
 */
export function usePhotoUrl(photoPath: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.photoUrl(photoPath || ''),
    queryFn: () => supabasePhotoAnalysisService.getPhotoUrl(photoPath!),
    enabled: !!photoPath,
    staleTime: 1000 * 60 * 50, // 50 minutes
    gcTime: 1000 * 60 * 55, // Keep in cache for 55 minutes
  });
}

/**
 * Get analyses for a session
 * Cache for 10 minutes
 */
export function useSessionAnalyses(sessionId: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.analyses(sessionId || ''),
    queryFn: () => supabasePhotoAnalysisService.getAnalysesBySession(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get analysis history for a session
 * Cache for 10 minutes
 */
export function useAnalysisHistory(sessionId: string | null, currentAnalysisId?: string) {
  return useQuery({
    queryKey: [...photoQueryKeys.analysisHistory(sessionId || ''), currentAnalysisId],
    queryFn: () => supabasePhotoAnalysisService.getAnalysisHistory(sessionId!, currentAnalysisId),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get progression analysis for a session
 * Cache for 5 minutes
 */
export function useProgressionAnalysis(sessionId: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.progression(sessionId || ''),
    queryFn: () => supabasePhotoAnalysisService.getProgressionAnalysis(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get timeline for a session
 * Cache for 2 minutes (frequently updated)
 */
export function useSessionTimeline(sessionId: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.timeline(sessionId || ''),
    queryFn: () => supabasePhotoAnalysisService.getSessionTimeline(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get active reminders
 * Cache for 5 minutes
 */
export function usePhotoReminders(sessionId?: string) {
  return useQuery({
    queryKey: photoQueryKeys.reminders(sessionId),
    queryFn: () => supabasePhotoAnalysisService.getActiveReminders(sessionId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Prefetch session details on hover
 * Use this for better UX when hovering over session cards
 */
export function usePrefetchSession() {
  const queryClient = useQueryClient();
  
  return (sessionId: string) => {
    queryClient.prefetchQuery({
      queryKey: photoQueryKeys.sessionDetails(sessionId),
      queryFn: () => supabasePhotoAnalysisService.getSessionById(sessionId),
      staleTime: 1000 * 60 * 2,
    });
  };
}

/**
 * Invalidate queries after mutations
 * Use this after uploading photos or creating analyses
 */
export function useInvalidatePhotoQueries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return {
    invalidateSessions: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: photoQueryKeys.sessions(user.id) });
      }
    },
    invalidateSession: (sessionId: string) => {
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.sessionDetails(sessionId) });
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.sessionPhotos(sessionId) });
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.analyses(sessionId) });
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.timeline(sessionId) });
    },
    invalidateAnalyses: (sessionId: string) => {
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.analyses(sessionId) });
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.analysisHistory(sessionId) });
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.progression(sessionId) });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: photoQueryKeys.all });
    }
  };
}