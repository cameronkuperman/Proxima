'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PhotoSession, AnalysisResult } from '@/types/photo-analysis';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

// Query keys
export const photoAnalysisKeys = {
  all: ['photo-analysis'] as const,
  sessions: (userId: string) => [...photoAnalysisKeys.all, 'sessions', userId] as const,
  sessionDetail: (sessionId: string) => [...photoAnalysisKeys.all, 'session', sessionId] as const,
  analysisHistory: (sessionId: string) => [...photoAnalysisKeys.all, 'history', sessionId] as const,
  timeline: (sessionId: string) => [...photoAnalysisKeys.all, 'timeline', sessionId] as const,
};

/**
 * Fetch all photo sessions from backend
 * Cached for 30 minutes
 */
export function usePhotoSessions(includeSensitive: boolean = false) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...photoAnalysisKeys.sessions(user?.id || ''), includeSensitive],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_URL}/api/photo-analysis/sessions?user_id=${user.id}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      const sessions = data.sessions || [];
      
      // Filter sensitive if needed
      return includeSensitive 
        ? sessions 
        : sessions.filter((s: PhotoSession) => !s.is_sensitive);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    placeholderData: (previousData) => previousData, // Show stale data while fetching
  });
}

/**
 * Fetch session details with photos and analyses
 */
export function useSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: photoAnalysisKeys.sessionDetail(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      
      const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session details');
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Fetch analysis history for timeline view
 * Includes all analyses with photo URLs
 */
export function useAnalysisHistory(sessionId: string | null, currentAnalysisId?: string) {
  return useQuery({
    queryKey: [...photoAnalysisKeys.analysisHistory(sessionId || ''), currentAnalysisId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      
      const url = `${API_URL}/api/photo-analysis/session/${sessionId}/analysis-history`;
      const params = currentAnalysisId ? `?current_analysis_id=${currentAnalysisId}` : '';
      
      const response = await fetch(url + params);
      if (!response.ok) throw new Error('Failed to fetch analysis history');
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 60, // 1 hour - analyses don't change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Fetch timeline data for visualization
 */
export function useSessionTimeline(sessionId: string | null) {
  return useQuery({
    queryKey: photoAnalysisKeys.timeline(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      
      const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Create a new photo session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { condition_name: string; description?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_URL}/api/photo-analysis/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...data
        })
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate sessions cache
      queryClient.invalidateQueries({ queryKey: photoAnalysisKeys.sessions(user?.id || '') });
    }
  });
}

/**
 * Upload photos and analyze
 */
export function useAnalyzePhotos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      photos, 
      context,
      autoCompare = false 
    }: { 
      sessionId: string; 
      photos: File[]; 
      context?: string;
      autoCompare?: boolean;
    }) => {
      // Step 1: Upload photos
      const formData = new FormData();
      formData.append('session_id', sessionId);
      photos.forEach(photo => formData.append('photos', photo));
      
      const uploadResponse = await fetch(`${API_URL}/api/photo-analysis/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) throw new Error('Failed to upload photos');
      const uploadData = await uploadResponse.json();
      
      // Step 2: Analyze photos
      const analyzeResponse = await fetch(`${API_URL}/api/photo-analysis/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          photo_ids: uploadData.uploaded_photos.map((p: any) => p.id),
          context: context || 'Please analyze this medical condition',
          auto_compare: autoCompare
        })
      });
      
      if (!analyzeResponse.ok) throw new Error('Failed to analyze photos');
      return analyzeResponse.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ 
        queryKey: photoAnalysisKeys.sessionDetail(variables.sessionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: photoAnalysisKeys.analysisHistory(variables.sessionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: photoAnalysisKeys.timeline(variables.sessionId) 
      });
    }
  });
}

/**
 * Follow-up upload with auto-compare
 */
export function useFollowUpUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      photos, 
      notes 
    }: { 
      sessionId: string; 
      photos: File[]; 
      notes?: string;
    }) => {
      const formData = new FormData();
      photos.forEach(photo => formData.append('photos', photo));
      formData.append('auto_compare', 'true');
      if (notes) formData.append('notes', notes);
      
      const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}/follow-up`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload follow-up photos');
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate all caches for this session
      queryClient.invalidateQueries({ 
        queryKey: photoAnalysisKeys.sessionDetail(variables.sessionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: photoAnalysisKeys.analysisHistory(variables.sessionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: photoAnalysisKeys.timeline(variables.sessionId) 
      });
    }
  });
}

/**
 * Prefetch session data for instant navigation
 */
export function usePrefetchSession() {
  const queryClient = useQueryClient();
  
  return (sessionId: string) => {
    // Prefetch all session data
    queryClient.prefetchQuery({
      queryKey: photoAnalysisKeys.sessionDetail(sessionId),
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch session');
        return response.json();
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
    
    // Also prefetch analysis history
    queryClient.prefetchQuery({
      queryKey: photoAnalysisKeys.analysisHistory(sessionId),
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}/analysis-history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
      },
      staleTime: 1000 * 60 * 60, // 1 hour
    });
  };
}