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
 * Cache for 30 minutes (sessions rarely change)
 */
export function usePhotoSessions(includeSensitive: boolean = false, limit: number = 20) {
  const { user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
  
  return useQuery({
    queryKey: [...photoQueryKeys.sessions(user?.id || ''), includeSensitive, limit],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Use backend API which returns sessions with thumbnail URLs
      const response = await fetch(`${API_URL}/api/photo-analysis/sessions?user_id=${user.id}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      const sessions = data.sessions || [];
      
      // Filter sensitive if needed
      return includeSensitive 
        ? sessions 
        : sessions.filter((s: PhotoSession) => !s.is_sensitive);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes - sessions don't change often
    gcTime: 1000 * 60 * 60 * 2, // 2 hours in cache
  });
}

/**
 * Get details for a specific session
 * Cache for 10 minutes
 */
export function useSessionDetails(sessionId: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.sessionDetails(sessionId || ''),
    queryFn: () => supabasePhotoAnalysisService.getSessionById(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes in cache
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
 * Cache for 1 hour (historical data)
 */
export function useSessionAnalyses(sessionId: string | null) {
  return useQuery({
    queryKey: photoQueryKeys.analyses(sessionId || ''),
    queryFn: () => supabasePhotoAnalysisService.getAnalysesBySession(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 60, // 1 hour - analyses are historical
    gcTime: 1000 * 60 * 60 * 2, // 2 hours in cache
  });
}

/**
 * Get analysis history for a session
 * Cache for 1 hour (historical data)
 */
export function useAnalysisHistory(sessionId: string | null, currentAnalysisId?: string) {
  return useQuery({
    queryKey: [...photoQueryKeys.analysisHistory(sessionId || ''), currentAnalysisId],
    queryFn: () => supabasePhotoAnalysisService.getAnalysisHistory(sessionId!, currentAnalysisId),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 60, // 1 hour - historical data
    gcTime: 1000 * 60 * 60 * 2, // 2 hours in cache
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