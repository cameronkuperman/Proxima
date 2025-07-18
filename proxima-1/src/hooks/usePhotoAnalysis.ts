'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PhotoSession, 
  AnalysisResult, 
  UploadResponse,
  PhotoCategory 
} from '@/types/photo-analysis';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export function usePhotoAnalysis() {
  const { user } = useAuth();
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

    // Get user ID from different possible locations
    const userId = user.id || user.sub || user.user_id;
    
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

    return response.json();
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
    return response.json();
  };

  // Create new session
  const createSession = async (params: {
    condition_name: string;
    description?: string;
  }): Promise<PhotoSession> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user ID from different possible locations
    const userId = user.id || user.sub || user.user_id;
    
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
    
    // Normalize the session object - backend returns session_id, frontend expects id
    const session: PhotoSession = {
      ...sessionData,
      id: sessionData.id || sessionData.session_id,
      session_id: sessionData.session_id || sessionData.id
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

  return {
    sessions,
    activeSession,
    isLoading,
    error,
    uploadPhotos,
    analyzePhotos,
    createSession,
    continueSession,
    exportSession,
    categorizePhoto,
    refetchSessions: fetchSessions
  };
}