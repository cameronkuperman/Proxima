import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { intelligenceClient, WeeklyHealthBrief, getCurrentWeekMonday } from '@/lib/intelligence-client';
import { differenceInDays, parseISO } from 'date-fns';

interface UseWeeklyBriefReturn {
  // Data
  brief: WeeklyHealthBrief | null;
  isCurrentWeek: boolean;
  weekOf: string;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Display control
  shouldAutoDisplay: boolean;
  hasBeenSeen: boolean;
  
  // Actions
  markAsOpened: () => Promise<void>;
  dismissBrief: (permanent?: boolean) => void;
  refreshBrief: () => Promise<void>;
  
  // User preferences
  briefsEnabled: boolean;
  setBriefsEnabled: (enabled: boolean) => void;
}

// Local storage keys for user preferences
const STORAGE_KEYS = {
  BRIEFS_ENABLED: 'proxima_briefs_enabled',
  DISMISSED_BRIEFS: 'proxima_dismissed_briefs',
  LAST_SEEN_BRIEF: 'proxima_last_seen_brief',
  PERMANENT_DISMISS: 'proxima_briefs_permanent_dismiss'
};

export function useWeeklyBrief(): UseWeeklyBriefReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Local state for display control
  const [shouldAutoDisplay, setShouldAutoDisplay] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const [briefsEnabled, setBriefsEnabled] = useState(true);
  
  // Load user preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem(STORAGE_KEYS.BRIEFS_ENABLED);
      const permanentDismiss = localStorage.getItem(STORAGE_KEYS.PERMANENT_DISMISS);
      
      if (permanentDismiss === 'true' || enabled === 'false') {
        setBriefsEnabled(false);
      }
    }
  }, []);
  
  // Query for fetching the weekly brief
  const {
    data: brief,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['weekly-brief', user?.id, getCurrentWeekMonday()],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('[useWeeklyBrief] Fetching brief for user:', user.id);
      const data = await intelligenceClient.fetchWeeklyBrief(user.id);
      
      if (!data) {
        console.log('[useWeeklyBrief] No brief found, will show previous week if available');
      } else {
        console.log('[useWeeklyBrief] Brief fetched for week:', data.week_of);
      }
      
      return data;
    },
    enabled: !!user?.id && briefsEnabled,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  // Determine if this is the current week's brief
  const isCurrentWeek = brief?.week_of === getCurrentWeekMonday();
  const weekOf = brief?.week_of || getCurrentWeekMonday();
  
  // Check if the brief has been seen before
  useEffect(() => {
    if (!brief || !user?.id) return;
    
    const lastSeenBrief = localStorage.getItem(STORAGE_KEYS.LAST_SEEN_BRIEF);
    const dismissedBriefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISMISSED_BRIEFS) || '[]');
    
    // Check if this specific brief has been seen
    const briefIdentifier = `${user.id}_${brief.week_of}`;
    const alreadySeen = lastSeenBrief === briefIdentifier || dismissedBriefs.includes(briefIdentifier);
    
    setHasBeenSeen(alreadySeen || !!brief.last_opened_at);
    
    console.log('[useWeeklyBrief] Brief seen status:', {
      briefId: brief.id,
      weekOf: brief.week_of,
      hasBeenSeen: alreadySeen || !!brief.last_opened_at,
      lastOpenedAt: brief.last_opened_at
    });
  }, [brief, user?.id]);
  
  // Determine if we should auto-display the brief
  useEffect(() => {
    if (!brief || !user?.id || !briefsEnabled) {
      setShouldAutoDisplay(false);
      return;
    }
    
    // Don't auto-display if already seen
    if (hasBeenSeen) {
      setShouldAutoDisplay(false);
      return;
    }
    
    // Check if this is a fresh login (first visit of the week)
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Auto-display on Monday through Wednesday for new briefs
    const shouldShow = dayOfWeek >= 1 && dayOfWeek <= 3 && isCurrentWeek;
    
    // If showing previous week's brief, only show if it's been less than 7 days
    const showPreviousWeek = !isCurrentWeek && brief.created_at && 
      differenceInDays(new Date(), brief.created_at) < 7;
    
    setShouldAutoDisplay(shouldShow || showPreviousWeek);
    
    console.log('[useWeeklyBrief] Auto-display decision:', {
      shouldShow: shouldShow || showPreviousWeek,
      dayOfWeek,
      isCurrentWeek,
      hasBeenSeen
    });
  }, [brief, user?.id, hasBeenSeen, isCurrentWeek, briefsEnabled]);
  
  // Mark brief as opened/read
  const markAsOpened = useCallback(async () => {
    if (!brief || !user?.id) return;
    
    console.log('[useWeeklyBrief] Marking brief as opened:', brief.id);
    
    // Update in database
    const success = await intelligenceClient.markBriefAsOpened(brief.id);
    
    if (success) {
      // Update local storage
      const briefIdentifier = `${user.id}_${brief.week_of}`;
      localStorage.setItem(STORAGE_KEYS.LAST_SEEN_BRIEF, briefIdentifier);
      
      // Update local state
      setHasBeenSeen(true);
      setShouldAutoDisplay(false);
      
      // Invalidate query to refetch with updated last_opened_at
      queryClient.invalidateQueries({
        queryKey: ['weekly-brief', user.id, brief.week_of]
      });
    }
  }, [brief, user?.id, queryClient]);
  
  // Dismiss the brief (temporarily or permanently)
  const dismissBrief = useCallback((permanent = false) => {
    if (!brief || !user?.id) return;
    
    console.log('[useWeeklyBrief] Dismissing brief:', { permanent });
    
    const briefIdentifier = `${user.id}_${brief.week_of}`;
    
    if (permanent) {
      // Permanently disable briefs
      localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, 'true');
      localStorage.setItem(STORAGE_KEYS.BRIEFS_ENABLED, 'false');
      setBriefsEnabled(false);
    } else {
      // Just dismiss this specific brief
      const dismissedBriefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISMISSED_BRIEFS) || '[]');
      if (!dismissedBriefs.includes(briefIdentifier)) {
        dismissedBriefs.push(briefIdentifier);
        localStorage.setItem(STORAGE_KEYS.DISMISSED_BRIEFS, JSON.stringify(dismissedBriefs));
      }
    }
    
    setHasBeenSeen(true);
    setShouldAutoDisplay(false);
  }, [brief, user?.id]);
  
  // Update briefs enabled preference
  const updateBriefsEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEYS.BRIEFS_ENABLED, String(enabled));
    if (enabled) {
      localStorage.removeItem(STORAGE_KEYS.PERMANENT_DISMISS);
    }
    setBriefsEnabled(enabled);
    
    if (enabled) {
      // Refetch brief when re-enabled
      refetch();
    }
  }, [refetch]);
  
  // Refresh the brief data
  const refreshBrief = useCallback(async () => {
    console.log('[useWeeklyBrief] Refreshing brief data');
    
    // Clear cache for this user
    if (user?.id) {
      await intelligenceClient.clearCache(user.id);
    }
    
    // Refetch
    await refetch();
  }, [user?.id, refetch]);
  
  return {
    // Data
    brief,
    isCurrentWeek,
    weekOf,
    
    // Loading states
    isLoading,
    isError,
    error: error as Error | null,
    
    // Display control
    shouldAutoDisplay,
    hasBeenSeen,
    
    // Actions
    markAsOpened,
    dismissBrief,
    refreshBrief,
    
    // User preferences
    briefsEnabled,
    setBriefsEnabled: updateBriefsEnabled
  };
}