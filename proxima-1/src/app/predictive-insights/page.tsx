'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import { 
  Zap, Brain, Heart, Clock, Calendar, Shield, Star,
  AlertTriangle, TrendingUp, Sparkles, ChevronRight,
  Droplets, Moon, Sun, Leaf, Activity, Eye, HelpCircle,
  Coffee, Wind, CloudRain, Pill, ThermometerSun, Waves,
  TreePine, Flower2, Sunrise, Network, BookOpen, RefreshCw,
  CheckCircle, Info, Battery, Sparkle
} from 'lucide-react';
import HealthConstellation from '@/components/HealthConstellation';
import { 
  useAIBodyPatterns,
  useAIPatternQuestions,
  useAIImmediatePredictions,
  useAISeasonalPredictions,
  useAILongtermPredictions
} from '@/hooks/ai';

export const dynamic = 'force-dynamic';

export default function PredictiveInsightsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'immediate' | 'seasonal' | 'longterm'>('immediate');
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  
  // Use individual AI prediction hooks
  const bodyPatternsData = useAIBodyPatterns();
  const patternQuestionsData = useAIPatternQuestions();
  const immediatePredictionsData = useAIImmediatePredictions();
  const seasonalPredictionsData = useAISeasonalPredictions();
  const longtermPredictionsData = useAILongtermPredictions();

  // Get active tab data
  const getActiveTabData = () => {
    switch (activeTab) {
      case 'immediate':
        return {
          predictions: immediatePredictionsData.predictions,
          isLoading: immediatePredictionsData.isLoading,
          isRefreshing: immediatePredictionsData.isRefreshing,
          dataQualityScore: immediatePredictionsData.dataQualityScore,
          status: immediatePredictionsData.status,
          refresh: immediatePredictionsData.refresh,
          error: immediatePredictionsData.error
        };
      case 'seasonal':
        return {
          predictions: seasonalPredictionsData.predictions,
          isLoading: seasonalPredictionsData.isLoading,
          isRefreshing: seasonalPredictionsData.isRefreshing,
          dataQualityScore: seasonalPredictionsData.dataQualityScore,
          status: seasonalPredictionsData.status,
          refresh: seasonalPredictionsData.refresh,
          error: seasonalPredictionsData.error,
          currentSeason: seasonalPredictionsData.currentSeason,
          nextTransition: seasonalPredictionsData.nextSeasonTransition
        };
      case 'longterm':
        return {
          assessments: longtermPredictionsData.assessments,
          isLoading: longtermPredictionsData.isLoading,
          isRefreshing: longtermPredictionsData.isRefreshing,
          status: longtermPredictionsData.status,
          refresh: longtermPredictionsData.refresh,
          error: longtermPredictionsData.error,
          overallTrajectory: longtermPredictionsData.overallTrajectory,
          keyFocusAreas: longtermPredictionsData.keyFocusAreas
        };
    }
  };

  const activeTabData = getActiveTabData();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alert': return 'text-red-400 border-red-500/20';
      case 'warning': return 'text-yellow-400 border-yellow-500/20';
      case 'info': return 'text-green-400 border-green-500/20';
      default: return 'text-gray-400 border-gray-500/20';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'migraine': <CloudRain className="w-6 h-6" />,
      'sleep': <Moon className="w-6 h-6" />,
      'energy': <Zap className="w-6 h-6" />,
      'mood': <Brain className="w-6 h-6" />,
      'stress': <AlertTriangle className="w-6 h-6" />,
      'allergy': <Flower2 className="w-6 h-6" />,
      'cardiovascular': <Heart className="w-6 h-6" />,
      'seasonal': <Leaf className="w-6 h-6" />,
      'physical': <Heart className="w-6 h-6" />,
      'other': <Activity className="w-6 h-6" />
    };
    return icons[category] || icons.other;
  };

  const getPatternQuestionIcon = (icon: string | undefined, category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'brain': <Brain className="w-5 h-5" />,
      'moon': <Moon className="w-5 h-5" />,
      'battery': <Battery className="w-5 h-5" />,
      'heart': <Heart className="w-5 h-5" />,
      'sparkles': <Sparkles className="w-5 h-5" />
    };
    
    // Use provided icon or fall back to category-based icon
    const iconKey = icon || patternQuestionsData.getQuestionIcon({ icon, category } as any);
    return iconMap[iconKey] || <Activity className="w-5 h-5" />;
  };

  const handleRefreshAll = async () => {
    // Refresh all data
    await Promise.all([
      bodyPatternsData.refresh(),
      patternQuestionsData.refresh(),
      immediatePredictionsData.refresh(),
      seasonalPredictionsData.refresh(),
      longtermPredictionsData.refresh()
    ]);
  };

  const handleRefreshTab = async () => {
    if (activeTab === 'longterm') {
      await longtermPredictionsData.refresh();
    } else {
      await activeTabData.refresh?.();
    }
  };

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
        {/* Enhanced Star Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-gradient-conic from-purple-600 via-pink-600 to-indigo-600 rounded-full blur-3xl animate-spin-slow opacity-20" />
            <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-gradient-conic from-blue-600 via-cyan-600 to-purple-600 rounded-full blur-3xl animate-spin-slow animation-delay-2000 opacity-20" />
          </div>
          
          {/* Subtle Star Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000">
            <pattern id="stars" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill="white" className="animate-twinkle" />
              <circle cx="50" cy="30" r="0.6" fill="white" className="animate-twinkle animation-delay-1000" />
              <circle cx="70" cy="60" r="1" fill="white" className="animate-twinkle animation-delay-2000" />
              <circle cx="30" cy="80" r="0.5" fill="white" className="animate-twinkle animation-delay-3000" />
              <circle cx="90" cy="90" r="0.7" fill="white" className="animate-twinkle animation-delay-1000" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#stars)" />
          </svg>
          
          {/* Additional star clusters - less concentrated */}
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.2,
                width: `${Math.random() * 1.5 + 0.5}px`,
                height: `${Math.random() * 1.5 + 0.5}px`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Predictive Alerts</h1>
                <p className="text-gray-400">Weekly AI-powered health predictions</p>
              </div>
            </div>

            {/* Global Refresh Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleRefreshAll}
                disabled={bodyPatternsData.isRefreshing || patternQuestionsData.isRefreshing || 
                         immediatePredictionsData.isRefreshing || seasonalPredictionsData.isRefreshing || 
                         longtermPredictionsData.isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${
                  bodyPatternsData.isRefreshing || patternQuestionsData.isRefreshing || 
                  immediatePredictionsData.isRefreshing || seasonalPredictionsData.isRefreshing || 
                  longtermPredictionsData.isRefreshing ? 'animate-spin' : ''
                }`} />
                {bodyPatternsData.isRefreshing || patternQuestionsData.isRefreshing || 
                 immediatePredictionsData.isRefreshing || seasonalPredictionsData.isRefreshing || 
                 longtermPredictionsData.isRefreshing ? 'Refreshing...' : 'Refresh All Predictions'}
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-full p-1 flex gap-1">
                <button
                  onClick={() => setActiveTab('immediate')}
                  className={`px-6 py-3 rounded-full transition-all ${
                    activeTab === 'immediate' 
                      ? 'bg-white/[0.1] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  This Week
                </button>
                <button
                  onClick={() => setActiveTab('seasonal')}
                  className={`px-6 py-3 rounded-full transition-all ${
                    activeTab === 'seasonal' 
                      ? 'bg-white/[0.1] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Leaf className="w-4 h-4 inline-block mr-2" />
                  Seasonal
                </button>
                <button
                  onClick={() => setActiveTab('longterm')}
                  className={`px-6 py-3 rounded-full transition-all ${
                    activeTab === 'longterm' 
                      ? 'bg-white/[0.1] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block mr-2" />
                  Long-term
                </button>
              </div>
            </div>

            {/* Data Quality Warning */}
            {activeTabData.dataQualityScore !== undefined && 
             activeTabData.dataQualityScore < 30 && 
             !activeTabData.isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 backdrop-blur-[20px] bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
              >
                <p className="text-yellow-300 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  We need more data for accurate predictions. Keep tracking your health to improve accuracy!
                </p>
              </motion.div>
            )}

            {/* Predictions Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    {activeTab === 'immediate' && <Calendar className="w-6 h-6 text-purple-400" />}
                    {activeTab === 'seasonal' && <Leaf className="w-6 h-6 text-green-400" />}
                    {activeTab === 'longterm' && <Eye className="w-6 h-6 text-purple-400" />}
                    {activeTab === 'immediate' ? 'Next 7 Days' : 
                     activeTab === 'seasonal' ? 'Next 3 Months' : 
                     'Long-term Outlook'}
                    <span className="text-sm text-gray-400 font-normal ml-auto">
                      {activeTabData.isLoading ? 'Loading...' : 
                       activeTab === 'longterm' ? `${activeTabData.assessments?.length || 0} assessments` :
                       `${activeTabData.predictions?.length || 0} predictions`}
                    </span>
                    {activeTabData.isRefreshing && (
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-2" />
                    )}
                  </h2>
                  
                  {/* Seasonal Info */}
                  {activeTab === 'seasonal' && activeTabData.currentSeason && (
                    <div className="mb-6 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Current Season</p>
                          <p className="text-lg text-white capitalize">{seasonalPredictionsData.formatSeason(activeTabData.currentSeason)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Next Transition</p>
                          <p className="text-lg text-white">{seasonalPredictionsData.formatTransitionDate(activeTabData.nextTransition)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Long-term Overall Trajectory */}
                  {activeTab === 'longterm' && activeTabData.overallTrajectory && !activeTabData.isLoading && (
                    <div className="mb-6 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Overall Health Trajectory</p>
                          <p className="text-lg text-white">{longtermPredictionsData.formatTrajectory(activeTabData.overallTrajectory)}</p>
                        </div>
                        {activeTabData.keyFocusAreas && activeTabData.keyFocusAreas.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-400">Key Focus Areas</p>
                            <div className="flex gap-2 mt-1">
                              {activeTabData.keyFocusAreas.map((area, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                                  {area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activeTabData.error || (activeTab !== 'longterm' && immediatePredictionsData.error) || 
                   (activeTab === 'seasonal' && seasonalPredictionsData.error) || 
                   (activeTab === 'longterm' && longtermPredictionsData.error) ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        Failed to load predictions
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Something went wrong. Please try again.
                      </p>
                      <button
                        onClick={handleRefreshTab}
                        className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Retry
                      </button>
                    </div>
                  ) : activeTabData.status === 'insufficient_data' ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4">
                        <Activity className="w-8 h-8 text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        More Data Needed
                      </h3>
                      <p className="text-gray-400 mb-4 max-w-md mx-auto">
                        We need at least {activeTab === 'longterm' ? '30 days' : '7 days'} of health data to generate accurate {activeTab} predictions.
                      </p>
                      <p className="text-sm text-gray-500">
                        Current data quality: {activeTabData.dataQualityScore || 0}%
                      </p>
                    </div>
                  ) : activeTabData.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="border border-gray-800 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gray-800 rounded-lg"></div>
                              <div className="flex-1 space-y-3">
                                <div className="h-5 bg-gray-800 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-800 rounded w-full"></div>
                                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (activeTab === 'longterm' ? activeTabData.assessments?.length === 0 : activeTabData.predictions?.length === 0) ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                        <Activity className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        No {activeTab} predictions available
                      </h3>
                      <p className="text-gray-400 mb-4 max-w-md mx-auto">
                        Keep logging your health data. As we learn your patterns, predictions will appear here.
                      </p>
                    </div>
                  ) : activeTab === 'longterm' ? (
                    // Long-term assessments view
                    <div className="space-y-6">
                      {activeTabData.assessments?.map((assessment) => (
                        <motion.div
                          key={assessment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className={`backdrop-blur-[20px] bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl p-6 cursor-pointer transition-all`}
                          onClick={() => setSelectedPrediction(
                            selectedPrediction === assessment.id ? null : assessment.id
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${longtermPredictionsData.getRiskLevelBg(assessment.trajectory.current_path.risk_level)}`}>
                              <Eye className={`w-6 h-6 ${longtermPredictionsData.getRiskLevelColor(assessment.trajectory.current_path.risk_level)}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-white mb-2">
                                {assessment.condition}
                              </h3>
                              <p className="text-gray-300 mb-2">{assessment.current_status}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">Current risk:</span>
                                <span className={`font-medium ${longtermPredictionsData.getRiskLevelColor(assessment.trajectory.current_path.risk_level)}`}>
                                  {assessment.trajectory.current_path.risk_level}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-400">Confidence:</span>
                                <span className={`font-medium ${
                                  assessment.confidence > 80 ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {assessment.confidence}%
                                </span>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                              selectedPrediction === assessment.id ? 'rotate-90' : ''
                            }`} />
                          </div>

                          <AnimatePresence>
                            {selectedPrediction === assessment.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6 pt-6 border-t border-white/[0.1]"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                  <div>
                                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                                      Current Path
                                    </h4>
                                    <p className="text-gray-300 mb-2">{assessment.trajectory.current_path.description}</p>
                                    <p className="text-sm text-gray-400">{assessment.trajectory.current_path.projected_outcome}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                      <Shield className="w-5 h-5 text-green-400" />
                                      Optimized Path
                                    </h4>
                                    <p className="text-gray-300 mb-2">{assessment.trajectory.optimized_path.description}</p>
                                    <div className="space-y-1">
                                      {assessment.trajectory.optimized_path.requirements.map((req, idx) => (
                                        <p key={idx} className="text-sm text-gray-400">• {req}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mb-4">
                                  <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                                    Risk Factors
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {assessment.risk_factors.map((factor, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-orange-500/10 text-orange-300 rounded-full text-sm">
                                        {factor}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                  <Shield className="w-5 h-5 text-green-400" />
                                  Prevention Strategy
                                </h4>
                                <div className="space-y-3">
                                  {assessment.prevention_strategy.map((strategy, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                      <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-xs text-gray-400">
                                        {idx + 1}
                                      </div>
                                      <p className="text-gray-300">{strategy}</p>
                                    </div>
                                  ))}
                                </div>
                                {assessment.data_basis && (
                                  <div className="mt-4 p-3 bg-white/[0.02] rounded-lg">
                                    <p className="text-sm text-gray-400">Based on: {assessment.data_basis}</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    // Regular predictions view (immediate/seasonal)
                    <div className="space-y-6">
                      {activeTabData.predictions?.map((prediction) => (
                        <motion.div
                          key={prediction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className={`backdrop-blur-[20px] bg-gradient-to-r ${prediction.gradient || 'from-gray-500/20 to-slate-500/20'} border ${getSeverityColor(prediction.severity || 'info')} rounded-xl p-6 cursor-pointer transition-all`}
                          onClick={() => setSelectedPrediction(
                            selectedPrediction === prediction.id ? null : prediction.id
                          )}
                        >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg bg-white/[0.05] ${getSeverityColor('severity' in prediction ? prediction.severity : 'info')}`}>
                            {getCategoryIcon('category' in prediction ? prediction.category : '')}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {prediction.title}
                            </h3>
                            <p className="text-gray-300 mb-2">{prediction.subtitle || ('description' in prediction ? prediction.description : '')}</p>
                            <p className="text-sm text-gray-400 mb-3">
                              Pattern: {prediction.pattern}
                            </p>
                            {'trigger_combo' in prediction && prediction.trigger_combo && (
                              <p className="text-sm text-gray-400 mb-3">
                                Trigger: {prediction.trigger_combo}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-400">
                                AI confidence level
                              </span>
                              <span className={`font-medium ${
                                prediction.confidence > 80 ? 'text-green-400' : 'text-yellow-400'
                              }`}>
                                {'historical_accuracy' in prediction && prediction.historical_accuracy ? 
                                 prediction.historical_accuracy : 
                                 `${prediction.confidence}% accuracy`}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                            selectedPrediction === prediction.id ? 'rotate-90' : ''
                          }`} />
                        </div>

                        <AnimatePresence>
                          {selectedPrediction === prediction.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-6 pt-6 border-t border-white/[0.1]"
                            >
                              <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-400" />
                                Prevention Protocol
                              </h4>
                              <div className="space-y-3">
                                {(prediction.prevention_protocol || ('preventionProtocols' in prediction ? prediction.preventionProtocols : []) || []).map((protocol, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-xs text-gray-400">
                                      {idx + 1}
                                    </div>
                                    <p className="text-gray-300">{protocol}</p>
                                  </div>
                                ))}
                              </div>
                              {'reasoning' in prediction && prediction.reasoning && (
                                <div className="mt-4 p-3 bg-white/[0.02] rounded-lg">
                                  <p className="text-sm text-gray-400">AI Reasoning: {prediction.reasoning}</p>
                                </div>
                              )}
                              {/* Seasonal specific fields */}
                              {'timeframe' in prediction && prediction.timeframe && prediction.type === 'seasonal' && (
                                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                                  <p className="text-sm text-blue-300">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Timeframe: {prediction.timeframe}
                                  </p>
                                  {'historical_context' in prediction && prediction.historical_context && (
                                    <p className="text-sm text-gray-400 mt-1">{prediction.historical_context}</p>
                                  )}
                                </div>
                              )}
                              {'dataPoints' in prediction && prediction.dataPoints && prediction.dataPoints.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="text-sm text-gray-400 mb-2">Based on:</h5>
                                  <ul className="space-y-1">
                                    {prediction.dataPoints.slice(0, 3).map((point: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-500">• {point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* AI-Generated Body Patterns */}
            {bodyPatternsData.error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 backdrop-blur-[20px] bg-red-500/10 border border-red-500/20 rounded-2xl p-6"
              >
                <p className="text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Failed to load body patterns. Please try refreshing.
                </p>
                <button
                  onClick={() => bodyPatternsData.refresh()}
                  className="mt-4 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
                >
                  Retry
                </button>
              </motion.div>
            ) : bodyPatternsData.status === 'insufficient_data' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 backdrop-blur-[20px] bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-yellow-400" />
                  Your Body's Unique Patterns
                </h3>
                <p className="text-yellow-300 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  We need more health data to identify your patterns. Keep tracking!
                </p>
              </motion.div>
            ) : !bodyPatternsData.isLoading && bodyPatternsData.bodyPatterns && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6"
              >
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-400" />
                  Your Body's Unique Patterns
                  {bodyPatternsData.patternMetadata && (
                    <span className="text-sm text-gray-400 font-normal ml-auto">
                      Confidence: {bodyPatternsData.patternMetadata.confidence_level}
                    </span>
                  )}
                  {bodyPatternsData.isRefreshing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-2" />
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-400 mb-3">You tend to...</h4>
                    <ul className="space-y-2 text-gray-300">
                      {bodyPatternsData.tendencies.length > 0 ? (
                        bodyPatternsData.tendencies.map((tendency, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            {tendency}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No patterns detected yet. Keep logging your health data!</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-gray-400 mb-3">Your body responds well to...</h4>
                    <ul className="space-y-2 text-gray-300">
                      {bodyPatternsData.positiveResponses.length > 0 ? (
                        bodyPatternsData.positiveResponses.map((response, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            {response}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">We're still learning what works best for you.</li>
                      )}
                    </ul>
                  </div>
                </div>
                {bodyPatternsData.patternMetadata && (
                  <div className="mt-4 pt-4 border-t border-white/[0.1] flex items-center gap-4 text-sm text-gray-400">
                    <span>{bodyPatternsData.patternMetadata.total_patterns_analyzed} patterns analyzed</span>
                    <span>•</span>
                    <span>{bodyPatternsData.patternMetadata.data_span_days} days of data</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI-Generated Pattern Explorer */}
            {patternQuestionsData.error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-[20px] bg-red-500/10 border border-red-500/20 rounded-2xl p-6"
              >
                <p className="text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Failed to load pattern questions. Please try refreshing.
                </p>
                <button
                  onClick={() => patternQuestionsData.refresh()}
                  className="mt-4 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
                >
                  Retry
                </button>
              </motion.div>
            ) : patternQuestionsData.status === 'insufficient_data' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-[20px] bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-yellow-400" />
                  Questions About Your Patterns
                </h3>
                <p className="text-yellow-300 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  We're still learning about your patterns. Continue tracking to unlock insights!
                </p>
              </motion.div>
            ) : !patternQuestionsData.isLoading && patternQuestionsData.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-8"
              >
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-purple-400" />
                  Questions About Your Patterns
                  <span className="text-sm text-gray-400 font-normal ml-auto">
                    {patternQuestionsData.totalQuestions} questions generated
                  </span>
                  {patternQuestionsData.isRefreshing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-2" />
                  )}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {patternQuestionsData.questions.slice(0, 4).map((pattern) => (
                  <motion.button
                    key={pattern.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPattern(selectedPattern === pattern.id ? null : pattern.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedPattern === pattern.id 
                        ? 'bg-white/[0.08] border-white/[0.2]' 
                        : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        pattern.category === 'mood' ? 'bg-purple-500/20 text-purple-400' :
                        pattern.category === 'sleep' ? 'bg-indigo-500/20 text-indigo-400' :
                        pattern.category === 'energy' ? 'bg-amber-500/20 text-amber-400' :
                        pattern.category === 'physical' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getPatternQuestionIcon(pattern.icon, pattern.category)}
                      </div>
                      <span className="text-white font-medium flex-1">{pattern.question}</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${
                        selectedPattern === pattern.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Pattern Deep Dive */}
              <AnimatePresence>
                {selectedPattern && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {patternQuestionsData.questions.filter(p => p.id === selectedPattern).map(pattern => (
                      <div key={pattern.id} className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.05]">
                        <p className="text-lg text-white mb-4">{pattern.brief_answer}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-400" />
                              Deep Dive
                            </h4>
                            <ul className="space-y-2">
                              {pattern.deep_dive.detailed_insights.map((insight, idx) => (
                                <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                                  <span className="text-purple-400 mt-1">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                              <Network className="w-4 h-4 text-blue-400" />
                              Connected Patterns
                            </h4>
                            <div className="space-y-2">
                              {pattern.deep_dive.connected_patterns.map((connection, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400/50" />
                                  <span className="text-gray-300 text-sm">{connection}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {pattern.deep_dive.actionable_advice.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-white/[0.1]">
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-400" />
                              What You Can Do
                            </h4>
                            <div className="space-y-2">
                              {pattern.deep_dive.actionable_advice.map((advice, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-300 text-sm">{advice}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {pattern.relevance_score > 0 && (
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                            <span>Relevance: {pattern.relevance_score}%</span>
                            {pattern.based_on.length > 0 && (
                              <>
                                <span>•</span>
                                <span>Based on: {pattern.based_on.join(', ')}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </UnifiedAuthGuard>
  );
}