'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import HealthProfileModal from '@/components/HealthProfileModal';
import OracleChat from '@/components/OracleChat';
import { QuickReportChat } from '@/components/health/QuickReportChat';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import OnboardingGuard from '@/components/OnboardingGuard';
import { MapPin, Pill, Heart, Clock, Moon, Coffee, Utensils, User, AlertTriangle, Zap, Brain, Camera, BrainCircuit, Star, Sparkles, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserProfile, OnboardingData } from '@/utils/onboarding';
import { useTrackingStore } from '@/stores/useTrackingStore';
import TrackingSuggestionCard from '@/components/tracking/TrackingSuggestionCard';
import ActiveTrackingCard from '@/components/tracking/ActiveTrackingCard';
import CustomizeTrackingModal from '@/components/tracking/CustomizeTrackingModal';
import LogDataModal from '@/components/tracking/LogDataModal';
import TrackingChart from '@/components/tracking/TrackingChart';

// Mock data for timeline
const mockTimelineData = [
  { id: 1, date: '2024-01-15', type: 'quick-scan', title: 'Headache analysis', aiProvider: 'openai' },
  { id: 2, date: '2024-01-12', type: 'photo', title: 'Skin rash tracking', photos: 3, aiProvider: 'claude' },
  { id: 3, date: '2024-01-10', type: '3d-body', title: 'Lower back pain', areas: ['lower-back', 'hip'], aiProvider: 'google' },
];

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [oracleChatOpen, setOracleChatOpen] = useState(false);
  // const [currentGraphIndex, setCurrentGraphIndex] = useState(0); // Removed, no longer needed
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
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
  const itemsPerPage = 4;
  
  // Past reports queue
  const [reportQueue] = useState([
    { id: 1, title: 'Severe Headache Report', time: '2 days ago', content: 'You reported a throbbing headache (7/10) on the right side of your head. You mentioned it started after a stressful meeting and lack of sleep.', tags: [{ icon: <MapPin className="w-3 h-3" />, text: 'Right temporal' }, { icon: <Pill className="w-3 h-3" />, text: 'Took ibuprofen' }] },
    { id: 2, title: 'Chest Discomfort Analysis', time: '3 days ago', content: 'You reported mild chest tightness (4/10) during exercise. Symptoms resolved with rest. You noted it might be stress-related.', tags: [{ icon: <Heart className="w-3 h-3" />, text: 'During exercise' }, { icon: <Clock className="w-3 h-3" />, text: '5 min duration' }] },
    { id: 3, title: 'Sleep Quality Check', time: '5 days ago', content: 'You reported poor sleep (4/10) with frequent wake-ups. Mentioned anxiety about upcoming deadlines affecting rest.', tags: [{ icon: <Moon className="w-3 h-3" />, text: '4 hrs total' }, { icon: <Moon className="w-3 h-3" />, text: '3 wake-ups' }] },
    { id: 4, title: 'Energy Crash Analysis', time: '1 week ago', content: 'You reported afternoon fatigue (3/10 energy) around 2-3 PM daily. Linked to irregular meal timing and high caffeine intake.', tags: [{ icon: <Coffee className="w-3 h-3" />, text: '4 cups/day' }, { icon: <Utensils className="w-3 h-3" />, text: 'Skipped lunch' }] },
    { id: 5, title: 'Anxiety Episode', time: '10 days ago', content: 'You reported elevated anxiety (6/10) with racing thoughts. Triggered by work presentation. Used breathing exercises.', tags: [{ icon: <BrainCircuit className="w-3 h-3" />, text: 'Meditation helped' }, { icon: <Star className="w-3 h-3" />, text: 'Work trigger' }] }
  ]);
  const [visibleReports, setVisibleReports] = useState([0, 1]);

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

  const getAIGradient = (provider: string) => {
    switch(provider) {
      case 'openai': return 'from-emerald-500/20 to-green-500/20';
      case 'claude': return 'from-purple-500/20 to-pink-500/20';
      case 'google': return 'from-blue-500/20 to-cyan-500/20';
      case 'xai': return 'from-orange-500/20 to-amber-500/20';
      default: return 'from-gray-500/20 to-gray-500/20';
    }
  };

  const dismissReport = (index: number) => {
    const newVisible = [...visibleReports];
    // Find next available report not currently visible
    const nextIndex = reportQueue.findIndex((_, idx) => !visibleReports.includes(idx) && idx !== visibleReports[index]);
    if (nextIndex !== -1) {
      newVisible[index] = nextIndex;
      setVisibleReports(newVisible);
    }
  };

  // Removed: const currentGraph = mockGraphData[currentGraphIndex]; - No longer needed for tracking dashboard
  // const maxValue = Math.max(...currentGraph.data.map(d => d.value));
  // const minValue = Math.min(...currentGraph.data.map(d => d.value));

  return (
    <AuthGuard requireAuth={true}>
      <OnboardingGuard>
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
          className="fixed left-0 top-0 h-full z-30"
          initial={{ width: '60px' }}
          animate={{ width: timelineExpanded ? '300px' : '60px' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onMouseEnter={() => setTimelineExpanded(true)}
          onMouseLeave={() => setTimelineExpanded(false)}
        >
          <div className="h-full backdrop-blur-[20px] bg-white/[0.02] border-r border-white/[0.05] relative">
            {/* Timeline gradient line */}
            <div className="absolute left-[29px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20" />
            
            {/* Timeline entries */}
            <div className="pt-20 px-4">
              {mockTimelineData.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative mb-8"
                >
                  {/* Date dot */}
                  <div className="absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
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
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${getAIGradient(entry.aiProvider)} backdrop-blur-sm border border-white/[0.05] cursor-pointer hover:border-white/[0.1] transition-all`}>
                          <p className="text-xs text-gray-400 mb-1">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-white font-medium">{entry.title}</p>
                          {entry.photos && (
                            <p className="text-xs text-gray-400 mt-1">📷 {entry.photos} photos</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
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
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group"
                onClick={() => router.push('/reports')}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600/20 to-cyan-600/20 flex items-center justify-center mb-4 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Health Reports</h3>
                <p className="text-gray-400 text-sm mb-2">Generate medical reports from your data</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-400">{reportQueue.length} reports</span>
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
                    {/* Dismissible Reports */}
                    <AnimatePresence mode="popLayout">
                      {visibleReports.map((reportIndex, idx) => {
                        const report = reportQueue[reportIndex];
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
                            <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.1] transition-all cursor-pointer">
                              <button
                                onClick={() => dismissReport(idx)}
                                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-medium text-white">{report.title}</h3>
                                <span className="text-xs text-gray-400">{report.time}</span>
                              </div>
                              <p className="text-gray-400 text-sm mb-3">
                                {report.content}
                              </p>
                              <div className="flex items-center gap-2">
                                {report.tags.map((tag, tagIdx) => (
                                  <React.Fragment key={tag.text}>
                                    <div className="flex items-center gap-1">
                                      {tag.icon}
                                      <span className="text-xs text-gray-400">{tag.text}</span>
                                    </div>
                                    {tagIdx < report.tags.length - 1 && <span className="text-xs text-gray-500">•</span>}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* View All Button - Athena inspired */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
                                onCustomize={() => {
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
                      <button className="text-xs text-yellow-400 hover:text-yellow-300 mt-2">
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
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-white font-medium">Today&apos;s chapter:</span> Your health journey continues to show positive trends. The reduction in headache intensity over the past week correlates with your improved sleep quality scores. Your body is responding well to the new routine you established 7 days ago.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    The AI analysis suggests that maintaining your current hydration levels and continuing with the stress management techniques will likely prevent the predicted migraine. Your consistency in tracking symptoms has enabled more accurate health predictions.
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">AI-generated narrative • Updated 2 hours ago</span>
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                      <span>View full intelligence</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
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

        {/* Single Floating Action Button */}
        <motion.div className="fixed bottom-8 right-8 z-40">
          <AnimatePresence>
            {floatingMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute bottom-16 right-0 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[200px]"
              >
                <button
                  onClick={() => {
                    setShowQuickReportChat(true);
                    setFloatingMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                >
                  <FileText className="w-5 h-5" />
                  Generate Report
                </button>
                <button
                  onClick={() => {
                    setOracleChatOpen(true);
                    setFloatingMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Brain className="w-5 h-5" />
                  Start New Chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setFloatingMenuOpen(!floatingMenuOpen)}
            className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center"
          >
            <svg 
              className={`w-6 h-6 text-white transition-transform ${floatingMenuOpen ? 'rotate-45' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </motion.div>

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
        {showCustomizeModal && currentSuggestion && suggestionId && (
          <CustomizeTrackingModal
            suggestion={{ 
              id: suggestionId,
              ...currentSuggestion 
            }}
            onSave={async (metricName, yAxisLabel) => {
              if (user?.id && suggestionId) {
                await configureSuggestion({
                  suggestion_id: suggestionId,
                  user_id: user.id,
                  metric_name: metricName,
                  y_axis_label: yAxisLabel,
                  show_on_homepage: true
                });
                setShowCustomizeModal(false);
              }
            }}
            onClose={() => {
              setShowCustomizeModal(false);
              clearSuggestion();
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
      </div>
      </OnboardingGuard>
    </AuthGuard>
  );
}