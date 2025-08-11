'use client';

import { useState, useEffect, useCallback } from 'react';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export function usePhotoAnalysis() {
  const { user } = useAuth();
  const { logEvent } = useAuditLog();
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [activeSession, setActiveSession] = useState<PhotoSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's photo sessions
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/photo-analysis/sessions?user_id=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load photo sessions');
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Categorize photo
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

  // Upload photos
  const uploadPhotos = async (sessionId: string, photos: File[]): Promise<UploadResponse> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user ID
    const userId = user.id;
    
    if (!userId) {
      console.error('User object structure:', user);
      throw new Error('Unable to find user ID in user object');
    }
    
    const formData = new FormData();
    photos.forEach(photo => formData.append('photos', photo));
    // Backend expects user_id in FormData directly
    formData.append('user_id', userId);
    formData.append('session_id', sessionId);
    
    console.log('Uploading photos with user_id:', userId);
    console.log('Session ID:', sessionId);

    // Call backend directly since it expects user_id in FormData, not auth headers
    const response = await fetch(`${API_URL}/api/photo-analysis/upload`, {
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
    
    return uploadResult;
  };

  // Analyze photos
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
    
    return result;
  };

  // Create new session
  const createSession = async (params: {
    condition_name: string;
    description?: string;
  }): Promise<PhotoSession> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user ID
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
    
    // Backend returns session_id, normalize to have both id and session_id
    const session: PhotoSession = {
      ...sessionData,
      id: sessionData.session_id,  // Use session_id as id
      session_id: sessionData.session_id,
      condition_name: sessionData.condition_name,
      created_at: sessionData.created_at
    };
    
    setSessions(prev => [session, ...prev]);
    setActiveSession(session);
    return session;
  };

  // Continue existing session
  const continueSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  };

  // Export session
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

  // Add follow-up photos to session
  const addFollowUpPhotos = async (
    sessionId: string, 
    photos: File[], 
    options?: {
      auto_compare?: boolean;
      notes?: string;
      compare_with_photo_ids?: string[];
    }
  ): Promise<FollowUpUploadResponse> => {
    // Debug logging
    console.log('addFollowUpPhotos called with:', {
      sessionId,
      photosCount: photos.length,
      options
    });
    
    if (!sessionId) {
      console.error('No sessionId provided to addFollowUpPhotos');
      throw new Error('Session ID is required');
    }
    
    // Validate photo count (max 5)
    if (photos.length > 5) {
      throw new Error('Maximum 5 photos allowed per follow-up upload');
    }
    
    const formData = new FormData();
    // Add photos
    photos.forEach(photo => formData.append('photos', photo));
    
    // Add auto_compare (backend expects string "true" or "false")
    formData.append('auto_compare', options?.auto_compare !== false ? 'true' : 'false');
    
    // Add optional notes
    if (options?.notes) {
      formData.append('notes', options.notes);
    }
    
    // Add compare_with_photo_ids as JSON string if provided
    if (options?.compare_with_photo_ids && options.compare_with_photo_ids.length > 0) {
      formData.append('compare_with_photo_ids', JSON.stringify(options.compare_with_photo_ids));
    }

    const url = `${API_URL}/api/photo-analysis/session/${sessionId}/follow-up`;
    console.log('Making follow-up request to:', url);
    console.log('FormData contents:', {
      photos: photos.length,
      auto_compare: options?.auto_compare !== false,
      notes: options?.notes,
      compare_with_photo_ids: options?.compare_with_photo_ids
    });
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Follow-up upload failed:', response.status, errorText);
      
      if (response.status === 404) {
        throw new Error('Session not found. Please refresh and try again.');
      } else if (response.status === 400) {
        throw new Error('Invalid request. Maximum 5 photos allowed.');
      } else {
        throw new Error('Follow-up upload failed');
      }
    }
    
    return response.json();
  };

  // Configure reminder for session
  const configureReminder = async (config: ReminderConfig): Promise<ReminderConfig> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/reminders/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (!response.ok) throw new Error('Reminder configuration failed');
    return response.json();
  };

  // Get monitoring suggestions
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

  // Get session timeline
  const getSessionTimeline = async (sessionId: string): Promise<SessionTimeline> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}/timeline`);
    
    if (!response.ok) throw new Error('Failed to fetch timeline');
    return response.json();
  };

  // Update reminder settings
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
    return response.json();
  };

  // Delete reminder
  const deleteReminder = async (reminderId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/reminders/${reminderId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete reminder');
  };

  // Get progression analysis
  const getProgressionAnalysis = async (sessionId: string): Promise<ProgressionAnalysisResponse> => {
    const response = await fetch(`${API_URL}/api/photo-analysis/session/${sessionId}/progression-analysis`);
    
    if (!response.ok) throw new Error('Failed to fetch progression analysis');
    return response.json();
  };

  // Get analysis history for a session
  const getAnalysisHistory = async (sessionId: string, currentAnalysisId?: string): Promise<AnalysisHistoryResponse> => {
    const url = new URL(`${API_URL}/api/photo-analysis/session/${sessionId}/analysis-history`);
    if (currentAnalysisId) {
      url.searchParams.append('current_analysis_id', currentAnalysisId);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) throw new Error('Failed to fetch analysis history');
    return response.json();
  };

  return {
    sessions,
    activeSession,
    setActiveSession,  // Export setActiveSession for direct control
    isLoading,
    error,
    uploadPhotos,
    analyzePhotos,
    createSession,
    continueSession,
    exportSession,
    categorizePhoto,
    refetchSessions: fetchSessions,
    // New methods
    addFollowUpPhotos,
    configureReminder,
    getMonitoringSuggestions,
    getSessionTimeline,
    updateReminder,
    deleteReminder,
    getProgressionAnalysis,
    getAnalysisHistory
  };
}