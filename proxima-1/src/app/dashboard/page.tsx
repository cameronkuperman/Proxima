'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import HealthProfileModal from '@/components/HealthProfileModal';
import OracleChat from '@/components/OracleChat';
import { QuickReportChat } from '@/components/health/QuickReportChat';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export const dynamic = 'force-dynamic';
import UnifiedFAB from '@/components/UnifiedFAB';
import { useTutorial } from '@/contexts/TutorialContext';
import { MapPin, Pill, Heart, Clock, User, AlertTriangle, Zap, Brain, Camera, BrainCircuit, Sparkles, FileText, ChevronLeft, ChevronRight, Search, Activity, ClipboardList, Calendar, Stethoscope, Shield, TrendingUp, PersonStanding, Filter } from 'lucide-react';
import { getUserProfile, OnboardingData } from '@/utils/onboarding';
import { useTrackingStore } from '@/stores/useTrackingStore';
import { useWeeklyAIPredictions } from '@/hooks/useWeeklyAIPredictions';
import { useHealthScore } from '@/hooks/useHealthScore';
import { TimelineEvent } from '@/lib/timeline-client';
import TrackingSuggestionCard from '@/components/tracking/TrackingSuggestionCard';
import ActiveTrackingCard from '@/components/tracking/ActiveTrackingCard';
import CustomizeTrackingModal from '@/components/tracking/CustomizeTrackingModal';
import LogDataModal from '@/components/tracking/LogDataModal';
import TrackingChart from '@/components/tracking/TrackingChart';
import { DashboardItem } from '@/services/trackingService';
import HistoryModal from '@/components/HistoryModal';
import AssessmentModal from '@/components/modals/AssessmentModal';
import { formatDistanceToNow, format } from 'date-fns';
import { supabaseReportsService as reportsService, GeneratedReport } from '@/services/supabaseReportsService';
import { healthStoryService } from '@/lib/health-story';
import type { HealthStoryData } from '@/lib/health-story';
import Tooltip from '@/components/ui/Tooltip';
import InfoButton from '@/components/ui/InfoButton';

// Type definitions
interface TimelineEntry {
  id: string;
  user_id: string;
  interaction_type: string;
  created_at: string;
  title: string;
  severity: string;
  metadata: {
    confidence?: number;
    urgency?: string;
    body_part?: string;
    has_summary?: boolean;
    escalated?: boolean;
    message_count?: number;
    questions_asked?: number;
    [key: string]: any;
  };
}


// Mock graph data - Removed, no longer needed for tracking dashboard
/*const mockGraphData = [
  {
    id: 'headache',
    name: 'Headache Severity',
    unit: 'Pain Level (0-10)',
    description: 'Your reported headache intensity over time',
    data: [
      { date: '2024-01-09', value: 3 },
      { date: '2024-01-10', value: 5 },
      { date: '2024-01-11', value: 7 },
      { date: '2024-01-12', value: 6 },
      { date: '2024-01-13', value: 7 },
      { date: '2024-01-14', value: 4 },
      { date: '2024-01-15', value: 2 },
    ],
    color: 'from-purple-500 to-pink-500',
    strokeColor: '#a855f7',
    fillColor: '#ec4899'
  },
  {
    id: 'chest',
    name: 'Chest Discomfort',
    unit: 'Discomfort (0-10)',
    description: 'Chest tightness and pain tracking',
    data: [
      { date: '2024-01-09', value: 0 },
      { date: '2024-01-10', value: 0 },
      { date: '2024-01-11', value: 2 },
      { date: '2024-01-12', value: 4 },
      { date: '2024-01-13', value: 3 },
      { date: '2024-01-14', value: 1 },
      { date: '2024-01-15', value: 0 },
    ],
    color: 'from-red-500 to-orange-500',
    strokeColor: '#ef4444',
    fillColor: '#f97316'
  },
  {
    id: 'sleep',
    name: 'Sleep Quality',
    unit: 'Quality (0-10)',
    description: 'How well you slept each night',
    data: [
      { date: '2024-01-09', value: 7 },
      { date: '2024-01-10', value: 4 },
      { date: '2024-01-11', value: 4 },
      { date: '2024-01-12', value: 5 },
      { date: '2024-01-13', value: 4 },
      { date: '2024-01-14', value: 6 },
      { date: '2024-01-15', value: 8 },
    ],
    color: 'from-blue-500 to-cyan-500',
    strokeColor: '#3b82f6',
    fillColor: '#06b6d4'
  },
  {
    id: 'anxiety',
    name: 'Anxiety Levels',
    unit: 'Anxiety (0-10)',
    description: 'Daily anxiety and stress tracking',
    data: [
      { date: '2024-01-09', value: 5 },
      { date: '2024-01-10', value: 6 },
      { date: '2024-01-11', value: 8 },
      { date: '2024-01-12', value: 7 },
      { date: '2024-01-13', value: 6 },
      { date: '2024-01-14', value: 4 },
      { date: '2024-01-15', value: 3 },
    ],
    color: 'from-amber-500 to-yellow-500',
    strokeColor: '#f59e0b',
    fillColor: '#eab308'
  }
];*/

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { initializeTutorial } = useTutorial();
  
  // Oracle rotating prompts state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const healthPrompts = [
    "What's causing my headaches?",
    "Should I see a doctor?",
    "Explain my test results",
    "Is this rash serious?",
    "How can I sleep better?",
    "Why am I always tired?",
    "Is my heart rate normal?",
    "What do these symptoms mean?",
    "How do I manage chronic pain?",
    "Are these side effects normal?",
    "What vitamins should I take?",
    "Why do I feel dizzy?"
  ];
  
  // Debug logging for tutorial
  useEffect(() => {
    console.log('Dashboard: Current URL:', window.location.href);
    console.log('Dashboard: Search params:', searchParams.toString());
    console.log('Dashboard: showTutorial param:', searchParams.get('showTutorial'));
  }, [searchParams]);
  
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineAnimating, setTimelineAnimating] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [timelineHasMore, setTimelineHasMore] = useState(true);
  const [timelineLoadingMore, setTimelineLoadingMore] = useState(false);
  const [timelineDateFilter, setTimelineDateFilter] = useState<string>('all');
  const [timelineTotalCount, setTimelineTotalCount] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineOffsetRef = useRef(0);
  const TIMELINE_PAGE_SIZE = 20; // Industry best practice: smaller page size for better performance
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [oracleChatOpen, setOracleChatOpen] = useState(false);
  // const [currentGraphIndex, setCurrentGraphIndex] = useState(0); // Removed, no longer needed
  // const [reportsMenuOpen, setReportsMenuOpen] = useState(false); // Commented out - not used
  // Dynamic health score with weekly comparison
  const { scoreData, isLoading: healthScoreLoading } = useHealthScore();
  const healthScore = scoreData?.score || 80;
  const [ambientHealth, setAmbientHealth] = useState('good'); // good, moderate, poor
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  // const [quickScanLoading, setQuickScanLoading] = useState(false); // Commented out - not used
  const [assessmentModalOpen, setAssessmentModalOpen] = useState<'body' | 'general' | null>(null);
  const [showQuickReportChat, setShowQuickReportChat] = useState(false);
  
  // Weekly AI Dashboard Alert
  const { dashboardAlert: aiAlert, isLoading: alertLoading } = useWeeklyAIPredictions();
  
  const [lastActivityTimes] = useState({
    quickScan: '2 hours ago',
    bodyMap: '3 days ago',
    photoAnalysis: 'Yesterday'
  });
  
  // Tracking state
  const { 
    dashboardItems, 
    fetchDashboard, 
    approveSuggestion,
    configureSuggestion,
    updateConfiguration,
    currentSuggestion,
    suggestionId,
    logDataPoint,
    clearSuggestion,
    loading: trackingLoading
  } = useTrackingStore();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartConfigId, setChartConfigId] = useState<string | null>(null);
  const [trackingPage, setTrackingPage] = useState(0);
  const [selectedTrackingItem, setSelectedTrackingItem] = useState<DashboardItem | null>(null);
  const itemsPerPage = 4;
  
  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TimelineEntry | null>(null);
  
  // Health timeline reports state
  const [healthTimelineData, setHealthTimelineData] = useState<GeneratedReport[]>([]);
  const [healthTimelineLoading, setHealthTimelineLoading] = useState(true);
  
  // Health story state
  const [latestHealthStory, setLatestHealthStory] = useState<HealthStoryData | null>(null);
  const [healthStoryLoading, setHealthStoryLoading] = useState(true);
  
  // Initialize visible reports based on available data
  const [visibleReports, setVisibleReports] = useState<number[]>([]);
  const [dismissedReports, setDismissedReports] = useState<number[]>([]);
  
  // Update visible reports when timeline data changes
  useEffect(() => {
    if (healthTimelineData.length > 0) {
      // Show first 2 reports if available
      setVisibleReports(healthTimelineData.length >= 2 ? [0, 1] : [0]);
      // Reset dismissed reports when new data loads
      setDismissedReports([]);
    }
  }, [healthTimelineData]);
  
  // Fetch health reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) return;
      
      setHealthTimelineLoading(true);
      try {
        const reports = await reportsService.fetchUserReports(user.id);
        // Get all available reports (service already limits to 50)
        setHealthTimelineData(reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setHealthTimelineData([]);
      } finally {
        setHealthTimelineLoading(false);
      }
    };
    
    fetchReports();
  }, [user?.id]);
  
  // Fetch latest health story
  useEffect(() => {
    const fetchLatestHealthStory = async () => {
      if (!user?.id) return;
      
      setHealthStoryLoading(true);
      try {
        // Use new Supabase method for faster loading
        const latestStory = await healthStoryService.getLatestHealthStoryFromSupabase(user.id);
        if (latestStory) {
          setLatestHealthStory(latestStory);
        } else {
          // Fallback to original method if needed
          const stories = await healthStoryService.getHealthStories(user.id);
          if (stories.length > 0) {
            setLatestHealthStory(stories[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching health story:', error);
        setLatestHealthStory(null);
      } finally {
        setHealthStoryLoading(false);
      }
    };
    
    fetchLatestHealthStory();
  }, [user?.id]);
  
  // Calculate date range based on filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timelineDateFilter) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case '2weeks':
        startDate.setDate(now.getDate() - 14);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'all':
      default:
        return null;
    }
    
    return startDate.toISOString();
  }, [timelineDateFilter]);

  // Fetch timeline data with pagination support
  const fetchTimeline = useCallback(async (append = false) => {
    if (!user?.id) return;
    
    // Check if we've reached the end when appending
    if (append && !timelineHasMore) {
      console.log('No more timeline items to load');
      return;
    }
    
    // Prevent multiple simultaneous loads
    if (timelineLoadingMore) return;
    
    // Debug: Track fetchTimeline calls
    // console.log('fetchTimeline called:', { append, currentOffset: timelineOffsetRef.current, hasMore: timelineHasMore });
    
    if (!append) {
      setTimelineLoading(true);
      setTimelineOffset(0);
      timelineOffsetRef.current = 0;
    } else {
      setTimelineLoadingMore(true);
    }
    setTimelineError(null);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Build the query - RLS will ensure users only see their own data
      let query = supabase
        .from('user_interactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Add date filter
      const startDate = getDateRange();
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      
      // Add search filter if provided
      if (timelineSearch) {
        query = query.or(`title.ilike.%${timelineSearch}%,metadata->>body_part.ilike.%${timelineSearch}%,metadata->>condition.ilike.%${timelineSearch}%`);
      }
      
      // Add pagination
      const currentOffset = append ? timelineOffsetRef.current : 0;
      query = query.range(currentOffset, currentOffset + TIMELINE_PAGE_SIZE - 1);
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) {
        throw new Error(queryError.message);
      }
      
      const newData = data || [];
      // Debug: Track query results
      // console.log('Timeline query result:', { 
      //   append, 
      //   currentOffset, 
      //   newDataLength: newData.length, 
      //   totalCount: count,
      //   pageSize: TIMELINE_PAGE_SIZE 
      // });
      
      if (append) {
        setTimelineData(prev => [...prev, ...newData]);
        setTimelineOffset(prev => prev + newData.length);
        timelineOffsetRef.current += newData.length;
      } else {
        setTimelineData(newData);
        setTimelineOffset(newData.length);
        timelineOffsetRef.current = newData.length;
      }
      
      setTimelineTotalCount(count || 0);
      
      // Only has more if we got a full page of results
      const hasMore = newData.length === TIMELINE_PAGE_SIZE && newData.length > 0;
      setTimelineHasMore(hasMore);
      
      // Log when we reach the end
      if (!hasMore && append) {
        console.log(`Reached end of timeline. Total items loaded: ${timelineOffsetRef.current}`);
      }
      
    } catch (err) {
      console.error('Timeline fetch error:', err);
      setTimelineError(err instanceof Error ? err.message : 'Failed to load timeline');
      if (!append) {
        setTimelineData([]);
      }
    } finally {
      setTimelineLoading(false);
      setTimelineLoadingMore(false);
    }
  }, [user?.id, timelineSearch, timelineDateFilter, getDateRange, timelineHasMore, timelineLoadingMore]);
  
  // Fetch timeline when dependencies change
  useEffect(() => {
    fetchTimeline(false);
  }, [user?.id, timelineSearch, timelineDateFilter]);
  
  // Infinite scroll handler
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Don't block scroll events during animation
      if (timelineLoadingMore || !timelineHasMore) {
        // console.log('Scroll blocked:', { timelineLoadingMore, timelineHasMore });
        return;
      }
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Debug logging (uncomment if needed)
      // console.log('Timeline scroll:', {
      //   scrollTop,
      //   scrollHeight,
      //   clientHeight,
      //   scrollPercentage,
      //   timelineLoadingMore,
      //   timelineHasMore,
      //   currentItems: timelineData.length,
      //   totalCount: timelineTotalCount
      // });
      
      // Load more when user reaches the bottom (within 50px)
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      if (distanceFromBottom < 50) {
        // console.log('Near bottom, triggering load more...', { distanceFromBottom });
        fetchTimeline(true);
      }
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [timelineLoadingMore, timelineHasMore, fetchTimeline, timelineData.length, timelineTotalCount]);
  
  // Helper function to get interaction color
  const getInteractionColor = useCallback((type: string) => {
    switch (type) {
      case 'quick_scan':
        return {
          gradient: 'from-emerald-500/20 to-green-500/20',
          iconColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/20',
        };
      case 'deep_dive':
        return {
          gradient: 'from-indigo-500/20 to-purple-500/20',
          iconColor: 'text-indigo-400',
          borderColor: 'border-indigo-500/20',
        };
      case 'flash_assessment':
        return {
          gradient: 'from-amber-500/20 to-yellow-500/20',
          iconColor: 'text-amber-400',
          borderColor: 'border-amber-500/20',
        };
      case 'general_assessment':
        return {
          gradient: 'from-blue-500/20 to-cyan-500/20',
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-500/20',
        };
      case 'general_deepdive':
        return {
          gradient: 'from-indigo-500/20 to-purple-500/20',
          iconColor: 'text-indigo-400',
          borderColor: 'border-indigo-500/20',
        };
      case 'photo_analysis':
        return {
          gradient: 'from-pink-500/20 to-rose-500/20',
          iconColor: 'text-pink-400',
          borderColor: 'border-pink-500/20',
        };
      case 'report':
        return {
          gradient: 'from-blue-500/20 to-cyan-500/20',
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-500/20',
        };
      case 'oracle_chat':
        return {
          gradient: 'from-amber-500/20 to-yellow-500/20',
          iconColor: 'text-amber-400',
          borderColor: 'border-amber-500/20',
        };
      case 'tracking_log':
        return {
          gradient: 'from-gray-500/20 to-slate-500/20',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-500/20',
        };
      default:
        return {
          gradient: 'from-gray-500/20 to-gray-500/20',
          iconColor: 'text-gray-400',
          borderColor: 'border-gray-500/20',
        };
    }
  }, []);

  // Initialize tutorial ONLY when coming from onboarding
  useEffect(() => {
    // ONLY show tutorial if explicitly requested via URL parameter
    const shouldShowTutorial = searchParams.get('showTutorial') === 'true';
    
    if (shouldShowTutorial && user?.id) {
      console.log('Dashboard: showTutorial parameter detected, user loaded');
      console.log('Dashboard: userProfile status:', profileLoading ? 'loading' : 'loaded', userProfile ? 'exists' : 'null');
      
      // Initialize tutorial with retry mechanism
      const initWithRetry = async (attempts = 0) => {
        console.log(`Dashboard: Tutorial init attempt ${attempts + 1}`);
        
        // Wait a bit if profile is still loading
        if (profileLoading && attempts < 5) {
          console.log('Dashboard: Profile still loading, waiting 500ms...');
          setTimeout(() => initWithRetry(attempts + 1), 500);
          return;
        }
        
        console.log('Dashboard: Initializing tutorial now');
        await initializeTutorial(true);
        
        // Clean up the URL parameter after successful init
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('showTutorial');
        router.replace(newUrl.pathname + newUrl.search);
      };
      
      // Start initialization
      initWithRetry();
    }
    // DO NOT initialize tutorial otherwise
  }, [user?.id, profileLoading, searchParams, initializeTutorial, router, userProfile]); // Re-run when user loads or profile loading changes

  // Listen for events from FAB
  useEffect(() => {
    const handleOpenQuickReportChat = () => {
      setShowQuickReportChat(true);
    };
    
    const handleOpenOracleChat = () => {
      setOracleChatOpen(true);
    };

    window.addEventListener('openQuickReportChat', handleOpenQuickReportChat);
    window.addEventListener('openOracleChat', handleOpenOracleChat);
    
    return () => {
      window.removeEventListener('openQuickReportChat', handleOpenQuickReportChat);
      window.removeEventListener('openOracleChat', handleOpenOracleChat);
    };
  }, []);

  // Rotate Oracle prompts every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % healthPrompts.length);
    }, 3500);
    
    return () => clearInterval(interval);
  }, [healthPrompts.length]);
  
  // Fetch user profile data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setProfileLoading(true);
        const profile = await getUserProfile(user.id, user.email || '', user.user_metadata?.name || '');
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch tracking dashboard data
  useEffect(() => {
    if (user?.id) {
      fetchDashboard(user.id);
    }
  }, [user?.id, fetchDashboard]);

  // Refresh timeline and reports when returning to dashboard
  useEffect(() => {
    const handleFocus = async () => {
      if (document.visibilityState === 'visible') {
        fetchTimeline();
        // Also refresh reports and health story
        if (user?.id) {
          try {
            const reports = await reportsService.fetchUserReports(user.id);
            setHealthTimelineData(reports);
            
            // Refresh health story (use Supabase for faster loading)
            const latestStory = await healthStoryService.getLatestHealthStoryFromSupabase(user.id);
            if (latestStory) {
              setLatestHealthStory(latestStory);
            } else {
              const stories = await healthStoryService.getHealthStories(user.id);
              if (stories.length > 0) {
                setLatestHealthStory(stories[0]);
              }
            }
          } catch (error) {
            console.error('Error refreshing data:', error);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchTimeline, user?.id]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!userProfile) return { percentage: 0, missingLifestyle: true, missingEmergency: true };

    let totalFields = 0;
    let completedFields = 0;

    // Basic info fields (assumed complete from onboarding)
    totalFields += 4; // name, email, age, blood_type
    completedFields += 4;

    // Health profile fields (assumed complete from onboarding)
    totalFields += 3; // medications, allergies, family_history arrays
    completedFields += 3;

    // Lifestyle fields
    const lifestyleFields = [
      userProfile.lifestyle_smoking_status,
      userProfile.lifestyle_alcohol_consumption,
      userProfile.lifestyle_exercise_frequency,
      userProfile.lifestyle_sleep_hours,
      userProfile.lifestyle_stress_level,
      userProfile.lifestyle_diet_type
    ];
    totalFields += lifestyleFields.length;
    const completedLifestyle = lifestyleFields.filter(field => field && field.trim() !== '').length;
    completedFields += completedLifestyle;
    const missingLifestyle = completedLifestyle < lifestyleFields.length;

    // Emergency contact fields (email is optional)
    const emergencyFields = [
      userProfile.emergency_contact_name,
      userProfile.emergency_contact_relation,
      userProfile.emergency_contact_phone
    ];
    totalFields += emergencyFields.length;
    const completedEmergency = emergencyFields.filter(field => field && field.trim() !== '').length;
    completedFields += completedEmergency;
    const missingEmergency = completedEmergency < emergencyFields.length;

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    return { percentage, missingLifestyle, missingEmergency };
  };

  const { percentage: completionPercentage, missingLifestyle, missingEmergency } = calculateProfileCompletion();

  // Keep ambient health color consistent (not based on score)
  useEffect(() => {
    setAmbientHealth('good'); // Always keep a consistent ambient color
  }, []);

  // Get health score gradient color
  const getHealthScoreGradient = () => {
    if (healthScore >= 90) return 'from-green-400 to-emerald-400';
    if (healthScore >= 75) return 'from-blue-400 to-cyan-400';
    if (healthScore >= 60) return 'from-yellow-400 to-orange-400';
    return 'from-orange-400 to-red-400';
  };

  const getAmbientGradient = () => {
    switch(ambientHealth) {
      case 'good': return 'from-green-600/5 to-emerald-600/5';
      case 'moderate': return 'from-yellow-600/5 to-orange-600/5';
      case 'poor': return 'from-red-600/5 to-pink-600/5';
      default: return '';
    }
  };

  const getInteractionIcon = (type: string) => {
    switch(type) {
      case 'quick_scan': return <Zap className="w-3 h-3" />;
      case 'deep_dive': return <Brain className="w-3 h-3" />;
      case 'flash_assessment': return <Sparkles className="w-3 h-3" />;
      case 'general_assessment': return <ClipboardList className="w-3 h-3" />;
      case 'general_deepdive': return <Search className="w-3 h-3" />;
      case 'photo_analysis': return <Camera className="w-3 h-3" />;
      case 'report': return <FileText className="w-3 h-3" />;
      case 'oracle_chat': return <BrainCircuit className="w-3 h-3" />;
      case 'tracking_log': return <Activity className="w-3 h-3" />;
      default: return <Heart className="w-3 h-3" />;
    }
  };

  const dismissReport = (index: number) => {
    const currentReportIndex = visibleReports[index];
    
    // Add current report to dismissed list
    const newDismissed = [...dismissedReports, currentReportIndex];
    setDismissedReports(newDismissed);
    
    // Find next available report that's neither visible nor dismissed
    const nextIndex = healthTimelineData.findIndex((_, idx) => 
      !visibleReports.includes(idx) && 
      !newDismissed.includes(idx)
    );
    
    if (nextIndex !== -1) {
      // Replace the dismissed report with the next available one
      const newVisible = [...visibleReports];
      newVisible[index] = nextIndex;
      setVisibleReports(newVisible);
    } else {
      // No more reports to show - remove this slot
      const newVisible = visibleReports.filter((_, i) => i !== index);
      setVisibleReports(newVisible);
      
      // If all reports have been viewed, optionally reset
      if (newVisible.length === 0 && healthTimelineData.length > 0) {
        // Reset to show first 2 reports again
        setVisibleReports(healthTimelineData.length >= 2 ? [0, 1] : [0]);
        setDismissedReports([]);
      }
    }
  };
  
  // Helper function to format report for display
  const formatReportItem = (report: GeneratedReport) => {
    const tags = [];
    
    // Show confidence as primary tag
    if (report.confidence_score) {
      tags.push({ 
        icon: <AlertTriangle className="w-3 h-3" />, 
        text: `${report.confidence_score}% confidence` 
      });
    }
    
    // Add report type icon/tag
    const getReportIcon = () => {
      switch(report.report_type) {
        case 'comprehensive': return <FileText className="w-3 h-3" />;
        case 'urgent_triage': return <AlertTriangle className="w-3 h-3" />;
        case 'photo_progression': return <Camera className="w-3 h-3" />;
        case 'symptom_timeline': return <Clock className="w-3 h-3" />;
        case 'specialist_focused': return <Stethoscope className="w-3 h-3" />;
        case 'annual_summary': return <Calendar className="w-3 h-3" />;
        default: return <FileText className="w-3 h-3" />;
      }
    };
    
    return {
      ...report,
      content: report.executive_summary,
      tags,
      icon: getReportIcon(),
      time: formatDistanceToNow(new Date(report.created_at), { addSuffix: true })
    };
  };

  // Removed: const currentGraph = mockGraphData[currentGraphIndex]; - No longer needed for tracking dashboard
  // const maxValue = Math.max(...currentGraph.data.map(d => d.value));
  // const minValue = Math.min(...currentGraph.data.map(d => d.value));

  // Remove the initial loading screen - dashboard loads progressively

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-x-hidden transition-all duration-1000">
        {/* Ambient Health Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getAmbientGradient()} transition-all duration-3000`} />
        
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl" />
          
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Timeline Sidebar */}
        <motion.div
          data-tour="timeline-sidebar"
          className="fixed left-0 top-0 h-full z-30"
          initial={{ width: '60px' }}
          animate={{ width: timelineExpanded ? '320px' : '60px' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onMouseEnter={() => {
            setTimelineExpanded(true);
            setTimelineAnimating(true);
          }}
          onMouseLeave={() => {
            setTimelineExpanded(false);
            setTimelineAnimating(true);
          }}
          onAnimationComplete={() => setTimelineAnimating(false)}
        >
          <div className={`h-full backdrop-blur-[20px] bg-white/[0.02] border-r border-white/[0.05] relative  flex flex-col ${timelineAnimating ? 'timeline-animating' : ''}`}>
            {/* Timeline gradient line - Fixed position */}
            <div className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20 pointer-events-none" style={{ left: '21px' }} />
            
            {/* Search and Filter Section (only visible when expanded) */}
            <AnimatePresence>
              {timelineExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="pt-4 pb-2 px-4 flex-shrink-0 space-y-3"
                  style={{ paddingLeft: '48px' }}
                >
                  {/* Date Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={timelineDateFilter}
                      onChange={(e) => setTimelineDateFilter(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm text-white focus:outline-none focus:border-white/[0.1] transition-all cursor-pointer"
                    >
                      <option value="week" className="bg-gray-900">Last Week</option>
                      <option value="2weeks" className="bg-gray-900">Last 2 Weeks</option>
                      <option value="month" className="bg-gray-900">Last Month</option>
                      <option value="3months" className="bg-gray-900">Last 3 Months</option>
                      <option value="all" className="bg-gray-900">All Time</option>
                    </select>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search interactions..."
                      value={timelineSearch}
                      onChange={(e) => setTimelineSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/[0.1] transition-all"
                    />
                  </div>
                  
                  {/* Results Count */}
                  {timelineTotalCount > 0 && (
                    <p className="text-xs text-gray-500 text-center">
                      Showing {timelineData.length} of {timelineTotalCount} interactions
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Timeline entries */}
            <div ref={timelineRef} className="flex-1 overflow-y-auto pl-4 pr-2 pt-4 pb-4 timeline-scrollbar relative min-h-0" style={{ paddingRight: '8px' }}>
              {timelineLoading ? (
                // Loading state
                <div className="space-y-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="relative">
                      <div className="absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-white/10" />
                      {timelineExpanded && (
                        <div className="ml-12">
                          <div className="h-16 bg-white/[0.02] rounded-lg animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : timelineError ? (
                // Error state
                <AnimatePresence>
                  {timelineExpanded ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <p className="text-sm text-red-400">Failed to load timeline</p>
                      <p className="text-xs text-gray-500 mt-1">Please try again later</p>
                    </motion.div>
                  ) : (
                    // Just show a single error dot when collapsed
                    <div className="relative">
                      <div className="absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-red-800/50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-red-600/50" />
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              ) : timelineData.length === 0 ? (
                // Empty state
                <AnimatePresence>
                  {timelineExpanded ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 ml-8"
                    >
                      <div className="mb-4">
                        <div className="w-12 h-12 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">No past interactions</p>
                      <p className="text-xs text-gray-500">Start with a Quick Scan to begin your health journey</p>
                    </motion.div>
                  ) : (
                    // Just show a single empty dot when collapsed
                    <div className="relative">
                      <div className="absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-gray-800/50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600/50" />
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              ) : (
                // Timeline data
                <>
                  {timelineData.map((entry, index) => {
                    const colors = getInteractionColor(entry.interaction_type);
                    const entryDate = new Date(entry.created_at);
                    const dateStr = format(entryDate, 'MMM d, yyyy');
                    
                    // Show date separator for first item or when date changes
                    const showDateSeparator = index === 0 || 
                      format(new Date(timelineData[index - 1].created_at), 'MMM d, yyyy') !== dateStr;
                    
                    return (
                    <React.Fragment key={entry.id}>
                      {/* Date separator */}
                      {showDateSeparator && timelineExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="relative mb-4 ml-12"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-white/[0.05]" />
                            <span className="text-xs text-gray-500 px-2">{dateStr}</span>
                            <div className="h-px flex-1 bg-white/[0.05]" />
                          </div>
                        </motion.div>
                      )}
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        className="relative mb-8"
                      >
                      {/* Date dot with icon */}
                      <div className={`absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 ${colors.borderColor} flex items-center justify-center`} style={{ left: '9px' }}>
                        <div className={colors.iconColor}>
                          {getInteractionIcon(entry.interaction_type)}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <AnimatePresence>
                        {timelineExpanded && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-12"
                          >
                            <motion.div 
                              whileHover={{ scale: 1.02, x: 3, y: -3 }}
                              onClick={() => {
                                setSelectedHistoryItem(entry);
                                setHistoryModalOpen(true);
                              }}
                              className={`p-3 rounded-lg bg-gradient-to-r ${colors.gradient} backdrop-blur-sm border border-white/[0.05] cursor-pointer hover:border-white/[0.1] transition-all relative`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                </p>
                                {entry.severity && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    entry.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                    entry.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {entry.severity}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white font-medium mb-1">{entry.title}</p>
                              
                              {/* Metadata badges */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {entry.metadata.body_part && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {entry.metadata.body_part}
                                  </span>
                                )}
                                {entry.metadata.category && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {entry.metadata.category}
                                  </span>
                                )}
                                {entry.metadata.photo_count && entry.metadata.photo_count > 0 && (
                                  <span className="text-xs text-gray-400">
                                    📷 {entry.metadata.photo_count} photos
                                  </span>
                                )}
                                {entry.metadata.message_count && entry.metadata.message_count > 0 && (
                                  <span className="text-xs text-gray-400">
                                    💬 {entry.metadata.message_count} messages
                                  </span>
                                )}
                                {entry.metadata.questions_asked && entry.metadata.questions_asked > 0 && (
                                  <span className="text-xs text-gray-400">
                                    ❓ {entry.metadata.questions_asked} questions
                                  </span>
                                )}
                                {entry.metadata.confidence && entry.metadata.confidence > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {Math.round(entry.metadata.confidence)}% confidence
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </motion.div>
                    </React.Fragment>
                    );
                  })}
                  
                  {/* Loading more indicator */}
                  {timelineLoadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* No more data indicator - only show after attempting to load more */}
                  {!timelineHasMore && timelineData.length > 0 && timelineData.length >= TIMELINE_PAGE_SIZE && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500">No more interactions</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content - adjusted for timeline */}
        <div className="relative z-10 ml-[60px] px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-8">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Welcome to Seimeo</h1>
                  <p className="text-gray-400">
                    {user?.user_metadata?.name || user?.user_metadata?.full_name ? 
                      `Good to see you, ${user.user_metadata?.name || user.user_metadata?.full_name}` : 
                      'Your personal health intelligence dashboard'
                    }
                  </p>
                </div>
                
                {/* Health Score */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="flex items-center gap-3"
                >
                  <div className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getHealthScoreGradient()}`}>
                    {healthScoreLoading ? (
                      <div className="w-12 h-12 bg-gray-700 rounded animate-pulse" />
                    ) : (
                      healthScore
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium">Health Score</p>
                    {scoreData && scoreData.previous_score !== undefined && (
                      <p className={`text-xs ${
                        scoreData.trend === 'up' ? 'text-green-400' : 
                        scoreData.trend === 'down' ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {scoreData.trend === 'up' && `↑ ${scoreData.score - (scoreData.previous_score || 0)} from last week`}
                        {scoreData.trend === 'down' && `↓ ${Math.abs(scoreData.score - (scoreData.previous_score || 0))} from last week`}
                        {scoreData.trend === 'same' && 'Same as last week'}
                      </p>
                    )}
                    {scoreData && !scoreData.previous_score && (
                      <p className="text-xs text-gray-500">First week tracked</p>
                    )}
                  </div>
                </motion.div>
              </div>
              
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-700 hover:bg-gray-900/70 rounded-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Health Profile Card */}
              <motion.div
                data-tour="profile-card"
                whileHover={{ scale: 1.02, x: 3, y: -3 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative"
                onClick={() => router.push('/profile')}
              >
                {/* Info button in top right */}
                <div className="absolute top-4 right-4 z-10">
                  <InfoButton content="Manage your health profile including medications, allergies, and emergency contacts. Complete your profile for more accurate assessments." position="bottom" />
                </div>
                {/* Completion ring background */}
                <div className="absolute top-4 right-14">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercentage / 100)}`}
                      className={`transition-all duration-500 ${
                        completionPercentage >= 80 ? 'text-green-500' : 
                        completionPercentage >= 60 ? 'text-yellow-500' : 
                        'text-red-500'
                      }`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                    {completionPercentage}%
                  </span>
                </div>
                
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome, {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </h3>
                <div className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                  {profileLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                      <span className="text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{userProfile?.allergies?.length || 0}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Pill className="w-3 h-3 text-blue-400" />
                        <span>{userProfile?.medications?.length || 0}</span>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileModalOpen(true);
                  }}
                  className={`w-full py-2 rounded-lg text-white text-sm font-medium transition-all ${
                    (missingLifestyle || missingEmergency) 
                      ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30' 
                      : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30'
                  }`}
                >
                  {(missingLifestyle || missingEmergency) ? 'Complete Profile' : 'Configure Profile'}
                </button>
              </motion.div>

              {/* 3D Body Visualization Card */}
              <motion.div
                data-tour="body-visualization-card"
                whileHover={{ scale: 1.02, x: 3, y: -3 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative"
                onClick={() => setAssessmentModalOpen('body')}
              >
                {/* Info button in top right */}
                <div className="absolute top-4 right-4 z-10">
                  <InfoButton content="Interactive 3D body model. Click exactly where symptoms occur for precise location tracking. Best for pain, injuries, and visible symptoms." position="bottom" />
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all">
                  <PersonStanding className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">3D Body Visualization</h3>
                <p className="text-gray-400 text-sm mb-4">Click exactly where it hurts on our interactive model</p>
              </motion.div>

              {/* General Assessment Card */}
              <motion.div
                whileHover={{ scale: 1.02, x: 3, y: -3 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative"
                onClick={() => setAssessmentModalOpen('general')}
              >
                {/* Info button in top right */}
                <div className="absolute top-4 right-4 z-10">
                  <InfoButton content="Describe symptoms in your own words. AI will analyze and ask follow-up questions. Best for fatigue, mental health, or multiple symptoms." position="bottom" />
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all">
                  <ClipboardList className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">General Assessment</h3>
                <p className="text-gray-400 text-sm mb-4">Describe how you&apos;re feeling overall</p>
              </motion.div>

              {/* Photo Analysis Card */}
              <motion.div
                whileHover={{ scale: 1.02, x: 3, y: -3 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative"
                onClick={() => router.push('/photo-analysis')}
              >
                {/* Info button in top right */}
                <div className="absolute top-4 right-4 z-10">
                  <InfoButton content="Upload photos for AI visual analysis. Track changes over time. Best for skin conditions, rashes, wounds, or any visible symptoms." position="bottom" />
                </div>
                {/* Ultra-thin reminder indicator */}
                {lastActivityTimes.photoAnalysis === 'Follow-up due' && (
                  <div className="absolute top-4 right-12 w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Follow-up photo recommended" />
                )}
                
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-pink-600/30 group-hover:to-purple-600/30 transition-all">
                  <Camera className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Photo Analysis</h3>
                <p className="text-gray-400 text-sm mb-2">Upload photos for visual symptom tracking</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-purple-400">Start Analysis</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">AI-Powered</span>
                </div>
              </motion.div>

              {/* Reports Card */}
              <motion.div
                data-tour="reports-card"
                whileHover={{ scale: 1.02, x: 3, y: -3 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative"
                onClick={() => router.push('/reports')}
              >
                {/* Info button in top right */}
                <div className="absolute top-4 right-4 z-10">
                  <InfoButton content="Generate professional medical reports from your health conversations. Perfect for sharing with healthcare providers." position="bottom" alignRight />
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Health Reports</h3>
                <p className="text-gray-400 text-sm mb-2">Generate medical reports from your data</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-400">{healthTimelineData.length} reports</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">View all</span>
                </div>
              </motion.div>

            </div>

            {/* Analytics Section - Past Reports & Graph */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6">Your Health Timeline</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Past Reports Section (Left) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="space-y-4 flex-1">
                    {/* Loading State */}
                    {healthTimelineLoading && (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
                            <div className="animate-pulse">
                              <div className="h-4 bg-white/[0.05] rounded w-1/3 mb-3"></div>
                              <div className="h-3 bg-white/[0.05] rounded w-full mb-2"></div>
                              <div className="h-3 bg-white/[0.05] rounded w-3/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Empty State */}
                    {!healthTimelineLoading && healthTimelineData.length === 0 && (
                      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8 text-center">
                        <div className="mb-4">
                          <div className="w-12 h-12 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <p className="text-gray-400 mb-2">No health reports yet</p>
                        <p className="text-xs text-gray-500">Generate a report from your health data to see it here</p>
                      </div>
                    )}
                    
                    {/* Timeline Reports */}
                    {!healthTimelineLoading && healthTimelineData.length > 0 && (
                      <>
                        <AnimatePresence mode="popLayout">
                          {visibleReports.map((reportIndex, idx) => {
                            const report = healthTimelineData[reportIndex];
                            if (!report) return null;
                            
                            const formattedReport = formatReportItem(report);
                            return (
                              <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="relative group"
                              >
                                <div 
                                  onClick={() => router.push(`/reports/${report.id}`)}
                                  className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.1] transition-all cursor-pointer"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissReport(idx);
                                    }}
                                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 text-gray-400">{formattedReport.icon}</div>
                                      <h3 className="text-base font-medium text-white">{formattedReport.title}</h3>
                                    </div>
                                    <span className="text-xs text-gray-400">{formattedReport.time}</span>
                                  </div>
                                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                    {formattedReport.content}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {formattedReport.tags.map((tag, tagIdx) => (
                                      <React.Fragment key={`${tag.text}-${tagIdx}`}>
                                        <div className="flex items-center gap-1">
                                          {tag.icon}
                                          <span className="text-xs text-gray-400">{tag.text}</span>
                                        </div>
                                        {tagIdx < formattedReport.tags.length - 1 && <span className="text-xs text-gray-500">•</span>}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </>
                    )}

                    {/* View All Button - Always visible */}
                    {!healthTimelineLoading && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/reports')}
                        className="w-full py-3 backdrop-blur-[20px] bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/[0.1] transition-all group"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-400 group-hover:text-white transition-colors">View all reports</span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Symptom Tracking Dashboard (Right) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Symptom Tracking</h2>
                        <p className="text-sm text-gray-400 mt-1">Monitor your health metrics over time</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trackingPage > 0 && (
                          <button
                            onClick={() => setTrackingPage(trackingPage - 1)}
                            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                          </button>
                        )}
                        {(trackingPage + 1) * itemsPerPage < dashboardItems.length && (
                          <button
                            onClick={() => setTrackingPage(trackingPage + 1)}
                            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Tracking Dashboard */}
                    {dashboardItems.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mb-4">
                          <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
                            <Brain className="w-8 h-8 text-gray-600" />
                          </div>
                        </div>
                        <p className="text-gray-400 mb-4">No tracking data yet</p>
                        <p className="text-sm text-gray-500">Complete a health scan to start tracking symptoms</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardItems
                          .slice(trackingPage * itemsPerPage, (trackingPage + 1) * itemsPerPage)
                          .map((item) => (
                            item.type === 'active' ? (
                              <ActiveTrackingCard
                                key={item.id}
                                item={item}
                                onLogValue={(configId) => {
                                  setSelectedConfigId(configId);
                                  setShowLogModal(true);
                                }}
                                onViewChart={(configId) => {
                                  setChartConfigId(configId);
                                  setShowChartModal(true);
                                }}
                                onCustomize={(item) => {
                                  setSelectedTrackingItem(item);
                                  setShowCustomizeModal(true);
                                }}
                              />
                            ) : (
                              <TrackingSuggestionCard
                                key={item.id}
                                suggestion={item}
                                onApprove={async () => {
                                  if (user?.id) {
                                    await approveSuggestion(item.id);
                                  }
                                }}
                                onCustomize={(suggestion) => {
                                  // For suggestions, we need to set them as current
                                  useTrackingStore.setState({ 
                                    currentSuggestion: {
                                      metric_name: suggestion.metric_name,
                                      metric_description: suggestion.description || '',
                                      y_axis_label: suggestion.y_axis_label || 'Value',
                                      y_axis_type: 'numeric',
                                      tracking_type: 'symptom',
                                      confidence_score: suggestion.confidence_score || 0.9
                                    },
                                    suggestionId: suggestion.id
                                  });
                                  setShowCustomizeModal(true);
                                }}
                              />
                            )
                          ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
              
              {/* Predictive Alert and AI Oracle - Below insights and graph */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-12">
                {/* AI-Powered Predictive Alert */}
                {alertLoading ? (
                  <div className="backdrop-blur-[20px] bg-gradient-to-r from-gray-600/10 to-gray-600/10 
                                  border border-gray-600/20 rounded-xl p-5 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-600/20 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-600/20 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-600/20 rounded w-full"></div>
                        <div className="h-3 bg-gray-600/20 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ) : aiAlert ? (
                  <div className={`backdrop-blur-[20px] rounded-xl p-5 border min-h-[180px] transition-all duration-200 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:bg-white/[0.04]
                    ${aiAlert.severity === 'critical' 
                      ? 'bg-gradient-to-r from-red-600/10 to-orange-600/10 border-red-600/20' 
                      : aiAlert.severity === 'warning'
                      ? 'bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-yellow-600/20'
                      : 'bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-blue-600/20'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        aiAlert.severity === 'critical' ? 'bg-red-500/20' :
                        aiAlert.severity === 'warning' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {aiAlert.severity === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                         aiAlert.severity === 'warning' ? <Zap className="w-5 h-5 text-yellow-400" /> :
                         <TrendingUp className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white mb-2">{aiAlert.title}</h3>
                        <p className="text-sm text-gray-300 mb-2">
                          {aiAlert.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {aiAlert.timeframe} • {aiAlert.confidence}% confidence
                          </p>
                          <button 
                            onClick={() => router.push(aiAlert.actionUrl || '/predictive-insights')}
                            className={`text-xs transition-colors ${
                              aiAlert.severity === 'critical' ? 'text-red-400 hover:text-red-300' :
                              aiAlert.severity === 'warning' ? 'text-yellow-400 hover:text-yellow-300' :
                              'text-blue-400 hover:text-blue-300'
                            }`}
                          >
                            {aiAlert.severity === 'critical' ? 'Take action →' : 'View details →'}
                          </button>
                        </div>
                        {aiAlert.preventionTip && (
                          <p className="text-xs text-gray-400 mt-2 italic">
                            Quick tip: {aiAlert.preventionTip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // No alerts state - good news!
                  <div className="backdrop-blur-[20px] bg-gradient-to-r from-green-600/10 to-emerald-600/10 
                                  border border-green-600/20 rounded-xl p-5 min-h-[180px] transition-all duration-200 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:bg-white/[0.04]">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Shield className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white mb-2">All Clear</h3>
                        <p className="text-sm text-gray-300">
                          No concerning patterns detected. Keep up your healthy habits!
                        </p>
                        <button 
                          onClick={() => router.push('/predictive-insights')}
                          className="text-xs text-green-400 hover:text-green-300 mt-2"
                        >
                          View your patterns →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Oracle Chat */}
                <div 
                  onClick={() => router.push('/oracle')}
                  className="backdrop-blur-[20px] bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-xl p-5 cursor-pointer hover:border-purple-600/30 min-h-[180px] transition-all duration-200 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:bg-white/[0.04] relative"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-white mb-2">AI Health Oracle</h3>
                      <p className="text-sm text-gray-300 mb-3">
                        Ask me anything about your health data or symptoms.
                      </p>
                      <div className="relative h-10">
                        <AnimatePresence mode="wait">
                          <motion.button
                            key={currentPromptIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 w-full text-left text-sm bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2 text-gray-400 hover:text-white hover:border-white/[0.1] transition-colors"
                          >
                            &quot;{healthPrompts[currentPromptIndex]}&quot; →
                          </motion.button>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Story Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">Your Health Story</h2>
              <motion.div 
                whileHover={{ scale: 1.02, x: 3, y: -3 }}
                onClick={() => router.push('/intelligence')}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer hover:border-white/[0.1] transition-all relative"
              >
                {healthStoryLoading ? (
                  // Loading state
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/[0.05] rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-white/[0.05] rounded w-full mb-2"></div>
                    <div className="h-3 bg-white/[0.05] rounded w-5/6"></div>
                  </div>
                ) : latestHealthStory ? (
                  // Display latest health story
                  <div className="prose prose-invert max-w-none">
                    {latestHealthStory.header && (
                      <h3 className="text-white font-medium text-lg mb-3">{latestHealthStory.header}</h3>
                    )}
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {/* Show first 300 characters of the story */}
                      {latestHealthStory.story_text.length > 300 
                        ? latestHealthStory.story_text.substring(0, 300) + '...' 
                        : latestHealthStory.story_text}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500">
                        AI-generated narrative • {formatDistanceToNow(new Date(latestHealthStory.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-purple-400">
                        <span>View full intelligence</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Default content when no health story exists
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed">
                      <span className="text-white font-medium">Start your health journey:</span> Complete health scans and track your symptoms to generate personalized health narratives. Your AI will analyze patterns and provide insights about your wellness trends.
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500">No health story yet</span>
                      <div className="flex items-center gap-2 text-xs text-purple-400">
                        <span>Generate your first story</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Health Tips Widget - Dynamic Actions from API */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {scoreData?.actions ? (
                scoreData.actions.map((action, index) => {
                  // Map colors based on index
                  const colors = [
                    'from-blue-600/20 to-cyan-600/20',
                    'from-purple-600/20 to-pink-600/20',
                    'from-green-600/20 to-emerald-600/20'
                  ];
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, x: 3, y: -3 }}
                      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg p-4 cursor-pointer relative"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colors[index % colors.length]} flex items-center justify-center text-2xl`}>
                          {action.icon}
                        </div>
                        <p className="text-sm text-gray-300">{action.text}</p>
                      </div>
                    </motion.div>
                  );
                })
              ) : healthScoreLoading ? (
                // Loading state for actions
                [...Array(3)].map((_, index) => (
                  <div key={index} className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 animate-pulse" />
                      <div className="flex-1 h-4 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : (
                // Fallback to static tips if no data
                [
                  { icon: '💧', tip: 'Stay hydrated throughout the day', color: 'from-blue-600/20 to-cyan-600/20' },
                  { icon: '🧘', tip: 'Practice stress reduction techniques', color: 'from-purple-600/20 to-pink-600/20' },
                  { icon: '🏃', tip: 'Get 30 minutes of physical activity', color: 'from-green-600/20 to-emerald-600/20' },
                ].map((tip, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02, x: 3, y: -3 }}
                    className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg p-4 cursor-pointer relative"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tip.color} flex items-center justify-center text-2xl`}>
                        {tip.icon}
                      </div>
                      <p className="text-sm text-gray-300">{tip.tip}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Old floating menu removed - using UnifiedFAB instead */}

        {/* Health Profile Modal */}
        <HealthProfileModal 
          isOpen={profileModalOpen} 
          onClose={() => setProfileModalOpen(false)} 
                onSave={() => {
                  // Refresh profile data when modal is saved
                  if (user) {
                    const fetchUpdatedProfile = async () => {
                      try {
                        setProfileLoading(true);
                        const updatedProfile = await getUserProfile(user.id, user.email || '', user.user_metadata?.name || '');
                        setUserProfile(updatedProfile);
                      } catch (error) {
                        console.error('Error refreshing profile:', error);
                      } finally {
                        setProfileLoading(false);
                      }
                    };
                    fetchUpdatedProfile();
                  }
                }}
                missingLifestyle={missingLifestyle}
                missingEmergency={missingEmergency}
        />

        {/* Oracle Chat */}
        <OracleChat
          isOpen={oracleChatOpen}
          onClose={() => setOracleChatOpen(false)}
          healthScore={healthScore}
        />

        {/* Quick Report Chat */}
        <QuickReportChat
          isOpen={showQuickReportChat}
          onClose={() => setShowQuickReportChat(false)}
        />

        {/* Tracking Modals */}
        {showCustomizeModal && ((currentSuggestion && suggestionId) || selectedTrackingItem) && (
          <CustomizeTrackingModal
            suggestion={
              selectedTrackingItem
                ? {
                    id: selectedTrackingItem.id,
                    metric_name: selectedTrackingItem.metric_name,
                    metric_description: selectedTrackingItem.description || '',
                    y_axis_label: selectedTrackingItem.y_axis_label || 'Value',
                    y_axis_type: 'numeric',
                    tracking_type: 'symptom',
                    confidence_score: 0.9
                  }
                : {
                    id: suggestionId!,
                    ...currentSuggestion!
                  }
            }
            onSave={async (metricName, yAxisLabel) => {
              if (user?.id) {
                if (selectedTrackingItem) {
                  // Update existing tracking config
                  await updateConfiguration({
                    configuration_id: selectedTrackingItem.id,
                    user_id: user.id,
                    metric_name: metricName,
                    y_axis_label: yAxisLabel
                  });
                } else if (suggestionId) {
                  await configureSuggestion({
                    suggestion_id: suggestionId,
                    user_id: user.id,
                    metric_name: metricName,
                    y_axis_label: yAxisLabel,
                    show_on_homepage: true
                  });
                }
                setShowCustomizeModal(false);
              }
            }}
            onClose={() => {
              setShowCustomizeModal(false);
              setSelectedTrackingItem(null);
              if (!selectedTrackingItem) {
                clearSuggestion();
              }
            }}
          />
        )}

        {showLogModal && selectedConfigId && (
          <LogDataModal
            configId={selectedConfigId}
            onSave={async (value, notes) => {
              await logDataPoint(selectedConfigId, value, notes);
              setShowLogModal(false);
              setSelectedConfigId(null);
            }}
            onClose={() => {
              setShowLogModal(false);
              setSelectedConfigId(null);
            }}
          />
        )}

        {showChartModal && chartConfigId && (
          <TrackingChart
            configId={chartConfigId}
            isOpen={showChartModal}
            onClose={() => {
              setShowChartModal(false);
              setChartConfigId(null);
            }}
          />
        )}
        
        {/* History Modal */}
        {historyModalOpen && selectedHistoryItem && (
          <HistoryModal
            isOpen={historyModalOpen}
            onClose={() => {
              setHistoryModalOpen(false);
              setSelectedHistoryItem(null);
            }}
            interactionId={selectedHistoryItem.id}
            interactionType={selectedHistoryItem.interaction_type}
            metadata={selectedHistoryItem.metadata}
          />
        )}

        {/* Assessment Modal */}
        <AssessmentModal
          isOpen={assessmentModalOpen !== null}
          onClose={() => setAssessmentModalOpen(null)}
          type={assessmentModalOpen || 'body'}
        />

        {/* Unified FAB */}
        <UnifiedFAB />
      </div>
    </UnifiedAuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}