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
  TreePine, Flower2, Sunrise, Network, BookOpen
} from 'lucide-react';
import HealthConstellation from '@/components/HealthConstellation';
import { useAIPredictions } from '@/hooks/useAIPredictions';
import { useAIPatternQuestions } from '@/hooks/useAIPatternQuestions';
import { useAIBodyPatterns } from '@/hooks/useAIBodyPatterns';

export const dynamic = 'force-dynamic';

interface Prediction {
  id: string;
  type: 'immediate' | 'seasonal' | 'longterm';
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  pattern: string;
  confidence: number;
  preventionProtocols: string[];
  icon: React.ReactNode;
  gradient: string;
}

interface Pattern {
  id: string;
  question: string;
  category: 'sleep' | 'energy' | 'mood' | 'physical';
  icon: React.ReactNode;
  answer: string;
  deepDive: string[];
  connections: string[];
}

const mockPredictions: Prediction[] = [
  // This Week
  {
    id: 'migraine-risk',
    type: 'immediate',
    severity: 'alert',
    title: 'Migraine Risk Building',
    description: 'Watch for migraine conditions in the next few days',
    pattern: 'Stress accumulation + weather pressure drop',
    confidence: 87,
    preventionProtocols: [
      'Increase water intake by 40% starting today',
      'Atenolol timing: Take 30 min earlier than usual',
      'Magnesium supplement before bed (400mg)',
      'Avoid aged cheeses and red wine'
    ],
    icon: <CloudRain className="w-6 h-6" />,
    gradient: 'from-red-500/20 to-orange-500/20'
  },
  {
    id: 'sleep-disruption',
    type: 'immediate',
    severity: 'warning',
    title: 'Sleep Disruption Alert',
    description: 'Insomnia pattern emerging mid-week',
    pattern: 'Late screen time + work deadline stress',
    confidence: 75,
    preventionProtocols: [
      '9 PM digital sunset (blue light off)',
      'Lavender + chamomile tea ritual',
      'Progressive muscle relaxation',
      'Morning light exposure (15 min)'
    ],
    icon: <Moon className="w-6 h-6" />,
    gradient: 'from-indigo-500/20 to-purple-500/20'
  },
  {
    id: 'energy-window',
    type: 'immediate',
    severity: 'info',
    title: 'Energy Optimization Window',
    description: 'Peak performance window approaching',
    pattern: 'Your cortisol rhythm + good sleep streak',
    confidence: 92,
    preventionProtocols: [
      'Morning protein within 30 min of waking',
      'Strategic caffeine: 10 AM only',
      '20-min power walk at lunch'
    ],
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  // Seasonal
  {
    id: 'allergy-cascade',
    type: 'seasonal',
    severity: 'warning',
    title: 'Allergy Cascade Warning',
    description: 'Spring pollen will trigger your histamine sensitivity',
    pattern: 'Timeline: Starting in 3-4 weeks',
    confidence: 82,
    preventionProtocols: [
      'Start Zyrtec 2 weeks before season (March 1)',
      'HEPA filter for bedroom',
      'Neti pot routine (evening)',
      'Local honey protocol (1 tbsp daily)'
    ],
    icon: <Flower2 className="w-6 h-6" />,
    gradient: 'from-yellow-500/20 to-amber-500/20'
  },
  {
    id: 'seasonal-mood',
    type: 'seasonal',
    severity: 'warning',
    title: 'Seasonal Energy Dip',
    description: 'Late winter energy dip approaching',
    pattern: 'Vitamin D deficiency + less daylight',
    confidence: 78,
    preventionProtocols: [
      'Light therapy box (10,000 lux, 30 min AM)',
      'Vitamin D3 supplement (4000 IU)',
      'Maintain exercise even when unmotivated'
    ],
    icon: <ThermometerSun className="w-6 h-6" />,
    gradient: 'from-gray-500/20 to-slate-500/20'
  }
];

const patternExplorer: Pattern[] = [
  {
    id: 'sunday-anxiety',
    question: 'Why do I get Sunday anxiety?',
    category: 'mood',
    icon: <Brain className="w-5 h-5" />,
    answer: 'Your Sunday anxiety stems from anticipating the work week.',
    deepDive: [
      'It peaks around 6-8pm when you start thinking about Monday',
      'Stronger when you have unfinished tasks',
      'Less intense after productive weekends',
      'Your body starts releasing stress hormones in anticipation'
    ],
    connections: ['Poor Sunday sleep', 'Monday morning fatigue', 'Tuesday recovery']
  },
  {
    id: 'sleep-breakers',
    question: 'What breaks my sleep?',
    category: 'sleep',
    icon: <Moon className="w-5 h-5" />,
    answer: 'Your sleep is most fragile between 2-4am.',
    deepDive: [
      'Late meals (after 8pm) = 70% chance of disrupted sleep',
      'Screen time past 10pm = lighter sleep all night',
      'Alcohol = wake up at 3am phenomenon',
      'Stress = takes 45+ min to fall asleep'
    ],
    connections: ['Next day brain fog', 'Afternoon crashes', '48hr recovery time']
  },
  {
    id: 'best-days',
    question: 'What makes my best days?',
    category: 'energy',
    icon: <Sparkles className="w-5 h-5" />,
    answer: 'Your best days follow a specific pattern we\'ve discovered.',
    deepDive: [
      'Morning sunlight within 30 min of waking',
      'Protein breakfast before 9am',
      'Movement before noon',
      'Meaningful work progress',
      'Evening wind-down routine'
    ],
    connections: ['Better sleep that night', 'Positive momentum next day', 'Lower stress all week']
  },
  {
    id: 'headache-timing',
    question: 'Why headaches on Thursdays?',
    category: 'physical',
    icon: <Zap className="w-5 h-5" />,
    answer: 'Your headaches are delayed stress responses.',
    deepDive: [
      'Monday-Tuesday stress accumulates',
      'Wednesday your body holds tension',
      'Thursday it releases as head pain',
      'Dehydration amplifies the pattern'
    ],
    connections: ['Neck tension Tuesday', 'Poor sleep Wednesday', 'Recovery by Saturday']
  }
];

export default function PredictiveInsightsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'immediate' | 'seasonal' | 'longterm'>('immediate');
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  
  // Use AI hooks instead of mock data
  const { predictions, isLoading: predictionsLoading } = useAIPredictions();
  const { questions, isLoading: questionsLoading } = useAIPatternQuestions();
  const { patterns: bodyPatterns, isLoading: patternsLoading } = useAIBodyPatterns();

  const getTabPredictions = () => {
    if (!predictions || !Array.isArray(predictions)) return [];
    return predictions.filter(p => p.type === activeTab);
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
                <h1 className="text-4xl font-bold text-white">Predictive Alerts</h1>
              </div>
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
                {activeTab === 'immediate' && (
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      Next 7 Days
                      <span className="text-sm text-gray-400 font-normal ml-auto">
                        {predictionsLoading ? 'Loading...' : `${getTabPredictions().length} predictions`}
                      </span>
                    </h2>
                    {predictionsLoading ? (
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
                          No predictions for this week
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
                                  Your trigger combo detected
                                </span>
                                <span className={`font-medium ${
                                  prediction.confidence > 80 ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {prediction.confidence}% historical accuracy
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
                                <div className="mt-6 flex gap-3">
                                  <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg text-white transition-all">
                                    Start Protocol
                                  </button>
                                  <button className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-lg text-gray-400 transition-all">
                                    Remind Me Later
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  )}
                )}

                {activeTab === 'seasonal' && (
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <Leaf className="w-6 h-6 text-green-400" />
                      Next 3 Months
                      <span className="text-sm text-gray-400 font-normal ml-auto">
                        {getTabPredictions().length} patterns
                      </span>
                    </h2>
                    <div className="space-y-6">
                      {getTabPredictions().map((prediction) => (
                        <motion.div
                          key={prediction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className={`backdrop-blur-[20px] bg-gradient-to-r ${prediction.gradient} border ${getSeverityColor(prediction.severity)} rounded-xl p-6 cursor-pointer transition-all`}
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
                                {prediction.pattern}
                              </p>
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'longterm' && (
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      <Eye className="w-6 h-6 text-purple-400" />
                      Long-term Outlook
                      <span className="text-sm text-gray-400 font-normal ml-auto">
                        Based on your profile
                      </span>
                    </h2>
                    
                    {/* Cardiovascular Outlook */}
                    <div className="space-y-6">
                      <div className="backdrop-blur-[20px] bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-white/[0.05] text-red-400">
                            <Heart className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                              Cardiovascular Risk Assessment
                            </h3>
                            <p className="text-gray-300">
                              Current: Beta blocker managed hypertension
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium mb-2">Risk Factors:</h4>
                            <ul className="space-y-1 text-gray-400 text-sm">
                              <li>• Family history (father: heart disease)</li>
                              <li>• Work stress levels</li>
                              <li>• Occasional poor sleep</li>
                            </ul>
                          </div>
                          
                          <div className="p-4 bg-white/[0.03] rounded-lg">
                            <h4 className="text-white font-medium mb-2">Your Trajectory:</h4>
                            <p className="text-gray-300 text-sm">
                              Current path: Stable but requires vigilance<br />
                              Optimized path: Could reduce medication by 45
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium mb-2">Prevention Strategy:</h4>
                            <ul className="space-y-1 text-gray-300 text-sm">
                              <li>• Mediterranean diet adoption (proven 30% risk reduction)</li>
                              <li>• Daily 30-min walks (reduces BP by 5-10 points)</li>
                              <li>• Stress management program</li>
                              <li>• Sleep optimization (7-8 hours consistently)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Diabetes Risk */}
                      <div className="backdrop-blur-[20px] bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-white/[0.05] text-amber-400">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                              Metabolic Health Forecast
                            </h3>
                            <p className="text-gray-300">
                              Current Risk: 32% by age 50 (population avg: 20%)
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium mb-2">Contributing Factors:</h4>
                            <ul className="space-y-1 text-gray-400 text-sm">
                              <li>• Family history (mother: Type 2)</li>
                              <li>• Current BMI trending upward</li>
                              <li>• Irregular meal timing</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium mb-2">Prevention Protocol:</h4>
                            <ul className="space-y-1 text-gray-300 text-sm">
                              <li>• Time-restricted eating (8-hour window)</li>
                              <li>• Replace simple carbs with complex</li>
                              <li>• Annual A1C monitoring</li>
                              <li>• Maintain weight within 5 lbs of current</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* AI-Generated Body Patterns */}
            {!patternsLoading && bodyPatterns && (
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
                      {bodyPatterns?.tendencies?.map((tendency, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          {tendency}
                        </li>
                      )) || <li className="text-gray-500">Loading patterns...</li>}
                    </ul>
                </div>
                  <div>
                    <h4 className="text-gray-400 mb-3">Your body responds well to...</h4>
                    <ul className="space-y-2 text-gray-300">
                      {bodyPatterns?.positiveResponses?.map((response, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          {response}
                        </li>
                      )) || <li className="text-gray-500">Loading responses...</li>}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI-Generated Pattern Explorer */}
            {!questionsLoading && questions && questions.length > 0 && (
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
                  {questions.slice(0, 4).map((pattern) => (
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
                    {questions.filter(p => p.id === selectedPattern).map(pattern => (
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