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
  TreePine, Flower2, Sunrise, Network, BookOpen, RefreshCw
} from 'lucide-react';
import HealthConstellation from '@/components/HealthConstellation';
import { useWeeklyAIPredictions } from '@/hooks/useWeeklyAIPredictions';

export const dynamic = 'force-dynamic';

export default function PredictiveInsightsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'immediate' | 'seasonal' | 'longterm'>('immediate');
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  
  // Use weekly AI predictions hook
  const { 
    allPredictions,
    patternQuestions,
    bodyPatterns,
    isLoading,
    isGenerating,
    status,
    regeneratePredictions
  } = useWeeklyAIPredictions();

  const getTabPredictions = () => {
    if (!allPredictions || !Array.isArray(allPredictions)) return [];
    return allPredictions.filter(p => p.type === activeTab);
  };

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
      'other': <Activity className="w-6 h-6" />
    };
    return icons[category] || icons.other;
  };

  const handleRegenerate = async () => {
    const result = await regeneratePredictions();
    if (result?.success) {
      // Success handled in hook
    } else if (result?.message) {
      // Show error message (e.g., rate limited)
      console.error(result.message);
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

            {/* Status Message */}
            {status === 'needs_initial' && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Generating your personalized predictions...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto"></div>
              </div>
            )}

            {/* Regenerate Button */}
            {status === 'success' && !isGenerating && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-sm text-gray-400 hover:text-white transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Regenerating...' : 'Refresh Predictions'}
                </button>
              </div>
            )}

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
                      {isLoading || isGenerating ? 'Loading...' : `${getTabPredictions().length} predictions`}
                    </span>
                  </h2>
                  
                  {(isLoading || isGenerating) ? (
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
                  ) : getTabPredictions().length === 0 ? (
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
                  ) : (
                    <div className="space-y-6">
                      {getTabPredictions().map((prediction) => (
                        <motion.div
                          key={prediction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className={`backdrop-blur-[20px] bg-gradient-to-r ${prediction.gradient || 'from-gray-500/20 to-slate-500/20'} border ${getSeverityColor(prediction.severity)} rounded-xl p-6 cursor-pointer transition-all`}
                          onClick={() => setSelectedPrediction(
                            selectedPrediction === prediction.id ? null : prediction.id
                          )}
                        >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg bg-white/[0.05] ${getSeverityColor(prediction.severity)}`}>
                            {getCategoryIcon(prediction.category)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {prediction.title}
                            </h3>
                            <p className="text-gray-300 mb-2">{prediction.description}</p>
                            <p className="text-sm text-gray-400 mb-3">
                              Pattern: {prediction.pattern}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-400">
                                AI confidence level
                              </span>
                              <span className={`font-medium ${
                                prediction.confidence > 80 ? 'text-green-400' : 'text-yellow-400'
                              }`}>
                                {prediction.confidence}% accuracy
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
                                {prediction.preventionProtocols.map((protocol, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-xs text-gray-400">
                                      {idx + 1}
                                    </div>
                                    <p className="text-gray-300">{protocol}</p>
                                  </div>
                                ))}
                              </div>
                              {prediction.reasoning && (
                                <div className="mt-4 p-3 bg-white/[0.02] rounded-lg">
                                  <p className="text-sm text-gray-400">AI Reasoning: {prediction.reasoning}</p>
                                </div>
                              )}
                              {prediction.dataPoints && prediction.dataPoints.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="text-sm text-gray-400 mb-2">Based on:</h5>
                                  <ul className="space-y-1">
                                    {prediction.dataPoints.slice(0, 3).map((point, idx) => (
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
            {!isLoading && !isGenerating && bodyPatterns && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6"
              >
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-400" />
                  Your Body's Unique Patterns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-400 mb-3">You tend to...</h4>
                    <ul className="space-y-2 text-gray-300">
                      {bodyPatterns?.tendencies && bodyPatterns.tendencies.length > 0 ? (
                        bodyPatterns.tendencies.map((tendency, idx) => (
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
                      {bodyPatterns?.positiveResponses && bodyPatterns.positiveResponses.length > 0 ? (
                        bodyPatterns.positiveResponses.map((response, idx) => (
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
              </motion.div>
            )}

            {/* AI-Generated Pattern Explorer */}
            {!isLoading && !isGenerating && patternQuestions && patternQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-8"
              >
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-purple-400" />
                  Questions About Your Patterns
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {patternQuestions.slice(0, 4).map((pattern) => (
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
                        {pattern.category === 'mood' ? <Brain className="w-5 h-5" /> :
                         pattern.category === 'sleep' ? <Moon className="w-5 h-5" /> :
                         pattern.category === 'energy' ? <Sparkles className="w-5 h-5" /> :
                         pattern.category === 'physical' ? <Zap className="w-5 h-5" /> :
                         <Activity className="w-5 h-5" />}
                      </div>
                      <span className="text-white font-medium">{pattern.question}</span>
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
                    {patternQuestions.filter(p => p.id === selectedPattern).map(pattern => (
                      <div key={pattern.id} className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.05]">
                        <p className="text-lg text-white mb-4">{pattern.answer}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-400" />
                              Deep Dive
                            </h4>
                            <ul className="space-y-2">
                              {pattern.deepDive.map((insight, idx) => (
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
                              {pattern.connections.map((connection, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400/50" />
                                  <span className="text-gray-300 text-sm">{connection}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
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