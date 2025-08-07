'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { 
  PhotoSession, 
  AnalysisResult, 
  UploadResponse,
  PhotoCategory,
  FollowUpUploadResponse,
  ReminderConfig,
  MonitoringSuggestion,
  SessionTimeline,
  ProgressionAnalysisResponse,
  AnalysisHistoryResponse
} from '@/types/photo-analysis';
import {
  usePhotoSessions,
  useSessionDetails,
  useSessionTimeline,
  useAnalysisHistory,
  useProgressionAnalysis,
  useInvalidatePhotoQueries
} from '@/hooks/queries/usePhotoQueries';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

/**
 * Hybrid Photo Analysis Hook
 * - READ operations use React Query + Supabase (fast, cached)
 * - WRITE operations use backend API (AI processing)
 * - Automatic cache invalidation after mutations
 */
export function usePhotoAnalysisV2() {
  const { user } = useAuth();
  const { logEvent } = useAuditLog();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // React Query hooks for read operations
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = usePhotoSessions(false); // Don't include sensitive for continue tracking
  const { data: activeSession } = useSessionDetails(activeSessionId);
  const { data: timeline } = useSessionTimeline(activeSessionId);
  const { data: analysisHistory } = useAnalysisHistory(activeSessionId);
  const { data: progressionData } = useProgressionAnalysis(activeSessionId);
  
  // Cache invalidation helpers
  const { invalidateSessions, invalidateSession, invalidateAnalyses, invalidateAll } = useInvalidatePhotoQueries();

  // ============================================
  // WRITE OPERATIONS (Backend API)
  // ============================================

  /**
   * Categorize photo using AI (Backend)
   */
  const categorizePhoto = async (photo: File, sessionId?: string): Promise<{
    category: PhotoCategory;
    confidence: number;
    session_context?: any;
  }> => {
    const formData = new FormData();
    formData.append('photo', photo);
    if (sessionId) formData.append('session_id', sessionId);

    const response = await fetch(`${API_URL}/api/photo-analysis/categorize`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Categorization error:', error);
      throw new Error('Categorization failed');
    }
    return response.json();
  };

  /**
   * Upload photos (Backend)
   * Then invalidate relevant queries
   */
  const uploadPhotos = async (sessionId: string, photos: File[]): Promise<UploadResponse> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;
    
    if (!userId) {
      console.error('User object structure:', user);
      throw new Error('Unable to find user ID in user object');
    }
    
    const formData = new FormData();
    photos.forEach(photo => formData.append('photos', photo));
    formData.append('user_id', userId);
    formData.append('session_id', sessionId);
    
    console.log('Uploading photos with user_id:', userId);
    console.log('Session ID:', sessionId);

    // Use our secure upload endpoint
    const response = await fetch('/api/photo-upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Upload error:', error);
      try {
        const errorJson = JSON.parse(error);
        throw new Error(errorJson.error || 'Upload failed');
      } catch {
        throw new Error('Upload failed');
      }
    }

    const uploadResult = await response.json();
    
    // Log medical photo upload
    if (user?.id && uploadResult.uploaded_photos?.length > 0) {
      await logEvent('MEDICAL_PHOTO_UPLOADED', {
        session_id: sessionId,
        photo_count: uploadResult.uploaded_photos.length,
        total_size: photos.reduce((sum, p) => sum + p.size, 0),
      });
    }
    
    // Invalidate session queries to refresh with new photos
    invalidateSession(sessionId);
    
    return uploadResult;
  };

  /**
   * Analyze photos using AI (Backend)
   * Then invalidate relevant queries
   */
  const analyzePhotos = async (params: {
    session_id: string;
    photo_ids: string[];
    context: string;
    comparison_photo_ids?: string[];
    temporary_analysis?: boolean;
  }): Promise<AnalysisResult> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        user_id: user?.id
      })
    });

    if (!response.ok) throw new Error('Analysis failed');
    
    const result = await response.json();
    
    // Log photo analysis event
    if (user?.id) {
      await logEvent('PHOTO_ANALYSIS_PERFORMED', {
        session_id: params.session_id,
        photo_count: params.photo_ids.length,
        has_comparison: !!params.comparison_photo_ids?.length,
        analysis_id: result.analysis_id,
      });
    }
    
    // Invalidate analyses queries to refresh with new analysis
    invalidateAnalyses(params.session_id);
    
    return result;
  };

  /**
   * Create new session (Backend)
   * Then invalidate sessions list
   */
  const createSession = async (params: {
    condition_name: string;
    description?: string;
  }): Promise<PhotoSession> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;
    
    if (!userId) {
      console.error('User object structure:', user);
      throw new Error('Unable to find user ID in user object');
    }
    
    const requestBody = {
      ...params,
      user_id: userId
    };
    
    console.log('Creating session with:', requestBody);
    console.log('User ID found:', userId);
    
    const response = await fetch(`${API_URL}/api/photo-analysis/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Session creation error:', error);
      throw new Error('Failed to create session');
    }
    
    const sessionData = await response.json();
    
    // Normalize the session object
    const session: PhotoSession = {
      ...sessionData,
      id: sessionData.id || sessionData.session_id,
      session_id: sessionData.session_id || sessionData.id
    };
    
    // Set as active session
    setActiveSessionId(session.id || session.session_id || '');
    
    // Invalidate sessions list to include the new session
    invalidateSessions();
    
    return session;
  };

  /**
   * Continue existing session (UI operation)
   */
  const continueSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    // Data will be loaded automatically via React Query
  };

  /**
   * Export session (Backend)
   */
  const exportSession = async (sessionId: string) => {
    const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'pdf', include_photos: true })
    });

    if (!response.ok) throw new Error('Export failed');
    
    const data = await response.json();
    // Open export URL in new tab
    window.open(data.export_url, '_blank');
  };

  /**
   * Add follow-up photos (Backend)
   * Then invalidate relevant queries
   */
  const addFollowUpPhotos = async (
    sessionId: string, 
    photos: File[], 
    options?: {
      auto_compare?: boolean;
      notes?: string;
      compare_with_photo_ids?: string[];
    }
  ): Promise<FollowUpUploadResponse> => {
    console.log('addFollowUpPhotos called with:', {
      sessionId,
      photosCount: photos.length,
      options
    });
    
    if (!sessionId) {
      console.error('No sessionId provided to addFollowUpPhotos');
      throw new Error('Session ID is required');
    }
    
    const formData = new FormData();
    photos.forEach(photo => formData.append('photos', photo));
    if (options?.auto_compare !== undefined) {
      formData.append('auto_compare', String(options.auto_compare));
    }
    if (options?.notes) {
      formData.append('notes', options.notes);
    }
    if (options?.compare_with_photo_ids) {
      formData.append('compare_with_photo_ids', JSON.stringify(options.compare_with_photo_ids));
    }

    const url = `${API_URL}/api/photo-analysis/session/${sessionId}/follow-up`;
    console.log('Making follow-up request to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Follow-up upload failed');
    
    const result = await response.json();
    
    // Invalidate session and timeline to refresh with new photos
    invalidateSession(sessionId);
    
    return result;
  };

  /**
   * Configure reminder (Backend)
   */
  const configureReminder = async (config: ReminderConfig): Promise<ReminderConfig> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/reminders/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (!response.ok) throw new Error('Reminder configuration failed');
    
    const result = await response.json();
    
    // Invalidate reminders query
    if (config.session_id) {
      invalidateSession(config.session_id);
    }
    
    return result;
  };

  /**
   * Get monitoring suggestions (Backend - AI operation)
   */
  const getMonitoringSuggestions = async (
    analysisId: string,
    contextInfo?: {
      is_first_analysis?: boolean;
      user_concerns?: string;
      duration?: string;
    }
  ): Promise<MonitoringSuggestion> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/monitoring/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        condition_context: contextInfo
      })
    });

    if (!response.ok) throw new Error('Failed to get monitoring suggestions');
    return response.json();
  };

  /**
   * Update reminder (Backend)
   */
  const updateReminder = async (
    reminderId: string,
    updates: Partial<ReminderConfig>
  ): Promise<ReminderConfig> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Failed to update reminder');
    
    const result = await response.json();
    
    // Invalidate queries
    invalidateAll();
    
    return result;
  };

  /**
   * Delete reminder (Backend)
   */
  const deleteReminder = async (reminderId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/reminders/${reminderId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete reminder');
    
    // Invalidate queries
    invalidateAll();
  };

  // ============================================
  // READ OPERATIONS (Using React Query)
  // ============================================
  
  // These are now powered by React Query hooks defined above
  // - sessions: from usePhotoSessions
  // - activeSession: from useSessionDetails
  // - timeline: from useSessionTimeline (replaces getSessionTimeline)
  // - analysisHistory: from useAnalysisHistory (replaces getAnalysisHistory)
  // - progressionData: from useProgressionAnalysis (replaces getProgressionAnalysis)

  return {
    // Read data (from React Query)
    sessions,
    activeSession,
    isLoading: isLoading || sessionsLoading,
    sessionsLoading, // Expose sessions loading state separately
    error,
    
    // Timeline and analysis data (from React Query)
    getSessionTimeline: () => timeline, // Wrapper for compatibility
    getAnalysisHistory: () => analysisHistory, // Wrapper for compatibility
    getProgressionAnalysis: () => progressionData, // Wrapper for compatibility
    
    // Write operations (to backend)
    uploadPhotos,
    analyzePhotos,
    createSession,
    continueSession,
    exportSession,
    categorizePhoto,
    refetchSessions,
    
    // Follow-up and reminder operations (to backend)
    addFollowUpPhotos,
    configureReminder,
    getMonitoringSuggestions,
    updateReminder,
    deleteReminder,
  };
}