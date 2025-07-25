'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import HealthProfileModal from '@/components/HealthProfileModal';
import OracleChat from '@/components/OracleChat';
import { QuickReportChat } from '@/components/health/QuickReportChat';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import UnifiedFAB from '@/components/UnifiedFAB';
import { useTutorial } from '@/contexts/TutorialContext';
import { MapPin, Pill, Heart, Clock, Utensils, User, AlertTriangle, Zap, Brain, Camera, BrainCircuit, Sparkles, FileText, ChevronLeft, ChevronRight, Search, Activity, ClipboardList, Calendar, Stethoscope } from 'lucide-react';
import { getUserProfile, OnboardingData } from '@/utils/onboarding';
import { useTrackingStore } from '@/stores/useTrackingStore';
import TrackingSuggestionCard from '@/components/tracking/TrackingSuggestionCard';
import ActiveTrackingCard from '@/components/tracking/ActiveTrackingCard';
import CustomizeTrackingModal from '@/components/tracking/CustomizeTrackingModal';
import LogDataModal from '@/components/tracking/LogDataModal';
import TrackingChart from '@/components/tracking/TrackingChart';
import { DashboardItem } from '@/services/trackingService';
import HistoryModal from '@/components/HistoryModal';
import { formatDistanceToNow } from 'date-fns';
import { reportsService, GeneratedReport } from '@/services/reportsService';
import { healthStoryService } from '@/lib/health-story';

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
  
  // Debug logging for tutorial
  useEffect(() => {
    console.log('Dashboard: Current URL:', window.location.href);
    console.log('Dashboard: Search params:', searchParams.toString());
    console.log('Dashboard: showTutorial param:', searchParams.get('showTutorial'));
  }, [searchParams]);
  
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineAnimating, setTimelineAnimating] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [oracleChatOpen, setOracleChatOpen] = useState(false);
  // const [currentGraphIndex, setCurrentGraphIndex] = useState(0); // Removed, no longer needed
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const [healthScore] = useState(92);
  const [ambientHealth, setAmbientHealth] = useState('good'); // good, moderate, poor
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [quickScanLoading, setQuickScanLoading] = useState(false);
  const [showQuickReportChat, setShowQuickReportChat] = useState(false);
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
    clearSuggestion
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
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  
  // Health timeline reports state
  const [healthTimelineData, setHealthTimelineData] = useState<GeneratedReport[]>([]);
  const [healthTimelineLoading, setHealthTimelineLoading] = useState(true);
  
  // Health story state
  const [latestHealthStory, setLatestHealthStory] = useState<any>(null);
  const [healthStoryLoading, setHealthStoryLoading] = useState(true);
  
  // Initialize visible reports based on available data
  const [visibleReports, setVisibleReports] = useState<number[]>([]);
  
  // Update visible reports when timeline data changes
  useEffect(() => {
    if (healthTimelineData.length > 0) {
      // Show first 2 reports if available
      setVisibleReports(healthTimelineData.length >= 2 ? [0, 1] : [0]);
    }
  }, [healthTimelineData]);
  
  // Fetch health reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) return;
      
      setHealthTimelineLoading(true);
      try {
        const reports = await reportsService.fetchUserReports(user.id);
        // Get the most recent 10 reports
        const recentReports = reports.slice(0, 10);
        setHealthTimelineData(recentReports);
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
        const stories = await healthStoryService.getHealthStories(user.id);
        if (stories.length > 0) {
          // Get the most recent story
          setLatestHealthStory(stories[0]);
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
  
  // Fetch timeline data for sidebar (keeping existing functionality)
  const fetchTimeline = useCallback(async () => {
    if (!user?.id) return;
    
    setTimelineLoading(true);
    setTimelineError(null);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Build the query - RLS will ensure users only see their own data
      let query = supabase
        .from('user_interactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Add search filter if provided
      if (timelineSearch) {
        query = query.or(`title.ilike.%${timelineSearch}%,metadata->>body_part.ilike.%${timelineSearch}%,metadata->>condition.ilike.%${timelineSearch}%`);
      }
      
      // Add pagination
      query = query.range(0, 49);
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) {
        throw new Error(queryError.message);
      }
      
      setTimelineData(data || []);
      setHasLoaded(true);
      
    } catch (err) {
      console.error('Timeline fetch error:', err);
      setTimelineError(err instanceof Error ? err.message : 'Failed to load timeline');
      setTimelineData([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [user?.id, timelineSearch]);
  
  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);
  
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
  }, [user?.id, profileLoading, searchParams]); // Re-run when user loads or profile loading changes

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
            setHealthTimelineData(reports.slice(0, 10));
            
            // Refresh health story
            const stories = await healthStoryService.getHealthStories(user.id);
            if (stories.length > 0) {
              setLatestHealthStory(stories[0]);
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

  // Calculate ambient health color based on health score
  useEffect(() => {
    if (healthScore >= 80) setAmbientHealth('good');
    else if (healthScore >= 60) setAmbientHealth('moderate');
    else setAmbientHealth('poor');
  }, [healthScore]);

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
      case 'photo_analysis': return <Camera className="w-3 h-3" />;
      case 'report': return <FileText className="w-3 h-3" />;
      case 'oracle_chat': return <BrainCircuit className="w-3 h-3" />;
      case 'tracking_log': return <Activity className="w-3 h-3" />;
      default: return <Heart className="w-3 h-3" />;
    }
  };

  const dismissReport = (index: number) => {
    const newVisible = [...visibleReports];
    // Find next available report not currently visible
    const nextIndex = healthTimelineData.findIndex((_, idx) => !visibleReports.includes(idx) && idx !== visibleReports[index]);
    if (nextIndex !== -1) {
      newVisible[index] = nextIndex;
      setVisibleReports(newVisible);
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

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden transition-all duration-1000">
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
          <div className={`h-full backdrop-blur-[20px] bg-white/[0.02] border-r border-white/[0.05] relative overflow-hidden flex flex-col ${timelineAnimating ? 'timeline-animating' : ''}`}>
            {/* Timeline gradient line - Fixed position */}
            <div className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20 pointer-events-none" style={{ left: '21px' }} />
            
            {/* Search bar (only visible when expanded) */}
            <AnimatePresence>
              {timelineExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="pt-4 pb-2 px-4 flex-shrink-0"
                  style={{ paddingLeft: '48px' }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Timeline entries */}
            <div className="flex-1 overflow-y-auto pl-4 pr-2 pt-4 pb-4 timeline-scrollbar relative" style={{ paddingRight: '8px' }}>
              {timelineLoading && !hasLoaded ? (
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
                timelineData.map((entry, index) => {
                  const colors = getInteractionColor(entry.interaction_type);
                  return (
                    <motion.div
                      key={entry.id}
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
                            <div 
                              onClick={() => {
                                setSelectedHistoryItem(entry);
                                setHistoryModalOpen(true);
                              }}
                              className={`p-3 rounded-lg bg-gradient-to-r ${colors.gradient} backdrop-blur-sm border border-white/[0.05] cursor-pointer hover:border-white/[0.1] transition-all`}
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
                                {entry.metadata.photo_count > 0 && (
                                  <span className="text-xs text-gray-400">
                                    📷 {entry.metadata.photo_count} photos
                                  </span>
                                )}
                                {entry.metadata.message_count > 0 && (
                                  <span className="text-xs text-gray-400">
                                    💬 {entry.metadata.message_count} messages
                                  </span>
                                )}
                                {entry.metadata.confidence > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {Math.round(entry.metadata.confidence)}% confidence
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
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
                  <h1 className="text-4xl font-bold text-white mb-2">Welcome to Proxima</h1>
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
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    {healthScore}
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium">Health Score</p>
                    <p className="text-xs text-green-400">↑ 3 from last week</p>
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
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative overflow-hidden"
                onClick={() => router.push('/profile')}
              >
                {/* Completion ring background */}
                <div className="absolute top-4 right-4">
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

              {/* Quick Scan Card */}
              <motion.div
                data-tour="quick-scan-card"
                whileHover={{ scale: quickScanLoading ? 1 : 1.02 }}
                className={`backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative overflow-hidden ${
                  quickScanLoading ? 'pointer-events-none' : ''
                }`}
                onClick={() => {
                  if (!quickScanLoading) {
                    setQuickScanLoading(true);
                    router.push('/scan?mode=quick');
                  }
                }}
              >
                {/* Loading overlay with shimmer effect */}
                <AnimatePresence>
                  {quickScanLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center"
                    >
                      {/* Background blur */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                      
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        animate={{ x: [-400, 400] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      
                      {/* Pulse circles */}
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 w-24 h-24 bg-emerald-500/20 rounded-full"
                          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 w-24 h-24 bg-emerald-500/30 rounded-full"
                          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        />
                        <motion.div
                          className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-10 h-10 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Loading text */}
                      <motion.p
                        className="absolute bottom-6 text-white font-medium"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Initializing Quick Scan...
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Normal content */}
                <div className={`transition-all duration-300 ${quickScanLoading ? 'opacity-30' : ''}`}>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-600/20 to-green-600/20 flex items-center justify-center mb-4 group-hover:from-emerald-600/30 group-hover:to-green-600/30 transition-all">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Quick Scan</h3>
                  <p className="text-gray-400 text-sm mb-2">Get instant AI-powered health insights</p>
                  <motion.p 
                    className="text-xs text-gray-500"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Last used: {lastActivityTimes.quickScan}
                  </motion.p>
                </div>
              </motion.div>

              {/* Deep Dive Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group"
                onClick={() => router.push('/scan?mode=deep')}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-indigo-600/30 group-hover:to-purple-600/30 transition-all">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Deep Dive</h3>
                <p className="text-gray-400 text-sm mb-2">Advanced analysis with follow-up questions</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-indigo-400">2-3 min</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">Premium</span>
                </div>
              </motion.div>

              {/* Photo Analysis Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group"
                onClick={() => router.push('/photo-analysis')}
              >
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
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group relative"
                onClick={() => router.push('/reports')}
              >
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
                {/* Predictive Alert */}
                <div className="backdrop-blur-[20px] bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-600/20 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-white mb-2">Predictive Alert</h3>
                      <p className="text-sm text-gray-300">
                        Based on your patterns, you might experience a migraine in 2 days. Consider preventive measures.
                      </p>
                      <button 
                        onClick={() => router.push('/predictive-insights')}
                        className="text-xs text-yellow-400 hover:text-yellow-300 mt-2"
                      >
                        View prevention tips →
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Oracle Chat */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => router.push('/oracle')}
                  className="backdrop-blur-[20px] bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-xl p-5 cursor-pointer hover:border-purple-600/30 transition-all"
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
                      <button className="w-full text-left text-sm bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2 text-gray-400 hover:text-white hover:border-white/[0.1] transition-all">
                        &quot;What&apos;s causing my headaches?&quot; →
                      </button>
                    </div>
                  </div>
                </motion.div>
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
              <div 
                onClick={() => router.push('/intelligence')}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer hover:border-white/[0.1] transition-all"
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
              </div>
            </motion.div>

            {/* Health Tips Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {[
                { icon: <Sparkles className="w-6 h-6 text-blue-400" />, tip: 'Increase water intake by 500ml today', color: 'from-blue-600/20 to-cyan-600/20' },
                { icon: <BrainCircuit className="w-6 h-6 text-purple-400" />, tip: '10-minute meditation before bed', color: 'from-purple-600/20 to-pink-600/20' },
                { icon: <Utensils className="w-6 h-6 text-green-400" />, tip: 'Take a 15-minute walk after lunch', color: 'from-green-600/20 to-emerald-600/20' },
              ].map((tip, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tip.color} flex items-center justify-center`}>
                      {tip.icon}
                    </div>
                    <p className="text-sm text-gray-300">{tip.tip}</p>
                  </div>
                </motion.div>
              ))}
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

        {/* Unified FAB */}
        <UnifiedFAB />
      </div>
    </UnifiedAuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}