'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, ChevronRight, Sparkles, TrendingUp, AlertCircle, BookOpen, RefreshCw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useWeeklyBrief } from '@/hooks/useWeeklyBrief';

interface WeeklyHealthBriefProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BriefData {
  greeting: {
    title: string;
    subtitle: string;
    readTime: string;
    generatedAt: Date;
  };
  mainStory: {
    headline: string;
    narrative: string;
    weekHighlights: {
      day: string;
      event: string;
      impact: 'positive' | 'trigger' | 'symptom';
      detail: string;
    }[];
    inlineInsights: {
      triggerText: string;
      expansion: string;
    }[];
  };
  discoveries: {
    primaryPattern: {
      title: string;
      description: string;
      confidence: number;
      evidence: string;
    };
    secondaryPatterns: {
      pattern: string;
      frequency: string;
      actionable: boolean;
    }[];
    comparisonToLastWeek: {
      overall: string;
      wins: string[];
      challenges: string[];
    };
  };
  experiments: {
    title: string;
    recommendations: {
      priority: 'high' | 'medium' | 'low';
      experiment: string;
      rationale: string;
      howTo: string;
      trackingMetric: string;
    }[];
    weeklyChecklist: {
      id: string;
      task: string;
      completed: boolean;
    }[];
  };
  spotlight: {
    title: string;
    content: string;
    learnMore: {
      teaser: string;
      fullContent: string;
    };
  };
  weekStats: {
    symptomFreeDays: number;
    bestDay: string;
    worstDay: string;
    trendsUp: string[];
    trendsDown: string[];
    aiConsultations: number;
    photosAnalyzed: number;
  };
  lookingAhead: {
    prediction: string;
    watchFor: string;
    encouragement: string;
  };
}

// Mock data generator
function generateMockBriefData(): BriefData {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  return {
    greeting: {
      title: "Week 47: The Pattern Emerges",
      subtitle: "Your body's signals are getting clearer",
      readTime: "5 min read",
      generatedAt: new Date()
    },
    mainStory: {
      headline: "The Tuesday-Wednesday Connection",
      narrative: `This week revealed something fascinating about your body's rhythm. Remember that intense Tuesday meeting? Your body certainly does.

We noticed a pattern that's been hiding in plain sight: every Tuesday when your stress levels spike during those 2pm meetings, your body initiates a cascade that doesn't surface until Wednesday afternoon. It's like your nervous system has a 24-hour delay switch.

Here's what's happening: When you experience acute stress on Tuesday, your cortisol levels spike. This is normal. But your body's particular response involves a delayed inflammatory reaction that manifests as those Wednesday headaches you've been tracking.

The good news? Now that we've identified this pattern, we can interrupt it. A simple 5-minute breathing protocol before your Tuesday meetings could prevent the entire cascade. We've seen this work for 68% of users with similar patterns.

Your morning walks have been particularly effective this week. On the three days you walked before 10am, your afternoon energy scores were 40% higher than baseline. This isn't coincidence - morning sunlight exposure directly impacts your mitochondrial function and circadian rhythm.

The data also revealed something interesting about your hydration patterns. On high-stress days, your water intake drops by about 30%, which compounds the inflammation response. A simple reminder system could help maintain consistent hydration even during busy periods.`,
      weekHighlights: [
        {
          day: "Monday",
          event: "Started week strong with morning walk",
          impact: "positive",
          detail: "This set a good baseline - your morning cortisol was 15% lower than usual"
        },
        {
          day: "Tuesday",
          event: "High-stress meeting at 2pm",
          impact: "trigger",
          detail: "Heart rate elevated for 3 hours post-meeting, sleep quality affected"
        },
        {
          day: "Wednesday",
          event: "Headache onset at 3pm",
          impact: "symptom",
          detail: "Severity 6/10, lasted 4 hours despite medication"
        },
        {
          day: "Thursday",
          event: "Implemented breathing exercise",
          impact: "positive",
          detail: "First attempt at intervention - noticed slight improvement in stress response"
        },
        {
          day: "Friday",
          event: "Best day of the week",
          impact: "positive",
          detail: "Morning walk + hydration goals met = 92% health score"
        }
      ],
      inlineInsights: [
        {
          triggerText: "24-hour delay switch",
          expansion: "Your HPA axis (hypothalamic-pituitary-adrenal) takes about 24 hours to fully process stress hormones. This is why Tuesday's stress shows up as Wednesday's symptoms."
        },
        {
          triggerText: "inflammatory reaction",
          expansion: "Delayed inflammation often presents as headaches, joint pain, or digestive issues. Your pattern specifically shows neuroinflammation markers."
        },
        {
          triggerText: "mitochondrial function",
          expansion: "Your cellular powerhouses respond to morning light by increasing ATP production, which directly impacts your afternoon energy levels."
        }
      ]
    },
    discoveries: {
      primaryPattern: {
        title: "Your Stress-Symptom Delay",
        description: "24-hour lag between stress exposure and physical symptoms",
        confidence: 0.87,
        evidence: "Based on 12 weeks of data with 89% consistency"
      },
      secondaryPatterns: [
        {
          pattern: "Morning walks reduce afternoon symptoms by 40%",
          frequency: "Observed 5 out of 7 days",
          actionable: true
        },
        {
          pattern: "Hydration drops 30% on high-stress days",
          frequency: "Consistent across 8 weeks",
          actionable: true
        },
        {
          pattern: "Weekend recovery pattern strong",
          frequency: "11 out of 12 weekends",
          actionable: false
        }
      ],
      comparisonToLastWeek: {
        overall: "+15% improvement",
        wins: ["Better sleep consistency", "Reduced headache intensity", "3 morning walks completed"],
        challenges: ["Stress management still needs work", "Hydration habits slipping on busy days"]
      }
    },
    experiments: {
      title: "This Week's Health Experiments",
      recommendations: [
        {
          priority: "high",
          experiment: "Pre-Meeting Breathing Protocol",
          rationale: "Based on your pattern, 5 minutes of box breathing before Tuesday meetings could prevent Wednesday headaches",
          howTo: "Set a reminder for 1:55pm Tuesday. Do 4-7-8 breathing for 5 minutes.",
          trackingMetric: "Wednesday headache occurrence and intensity"
        },
        {
          priority: "medium",
          experiment: "Hydration Checkpoint System",
          rationale: "Your dehydration correlates with symptom severity",
          howTo: "Set 3 daily water reminders: 10am, 2pm, 6pm",
          trackingMetric: "Daily water intake and afternoon energy"
        },
        {
          priority: "low",
          experiment: "Evening Wind-Down Routine",
          rationale: "Better sleep quality could reduce overall symptom frequency",
          howTo: "No screens after 9pm, 10-minute meditation at 9:30pm",
          trackingMetric: "Sleep quality score and next-day symptoms"
        }
      ],
      weeklyChecklist: [
        { id: "breath_tuesday", task: "Complete breathing before Tuesday meeting", completed: false },
        { id: "walk_morning", task: "Morning walk at least 4 days", completed: false },
        { id: "hydrate_consistent", task: "Hit hydration goals 5+ days", completed: false },
        { id: "track_symptoms", task: "Log symptoms daily", completed: false }
      ]
    },
    spotlight: {
      title: "Understanding Your Stress Response",
      content: `This week's spotlight: Why stress affects you a day later.

Your body's stress response isn't instant - it's a complex cascade:
1. Initial trigger (Tuesday meeting)
2. Cortisol release (immediate)
3. Inflammatory markers increase (6-12 hours)
4. Symptom manifestation (18-24 hours)

This is why Tuesday stress = Wednesday symptoms. Understanding this delay gives you a powerful intervention window.`,
      learnMore: {
        teaser: "Research shows that understanding your stress-symptom delay...",
        fullContent: "can help you prevent 60% of stress-related symptoms through targeted interventions. The key is acting during the 'golden window' - the 6-12 hour period after stress exposure when inflammation is building but hasn't yet manifested as symptoms."
      }
    },
    weekStats: {
      symptomFreeDays: 3,
      bestDay: "Friday (health score: 92)",
      worstDay: "Wednesday (health score: 61)",
      trendsUp: ["Energy", "Sleep quality", "Morning routine"],
      trendsDown: ["Stress management", "Afternoon fatigue"],
      aiConsultations: 2,
      photosAnalyzed: 1
    },
    lookingAhead: {
      prediction: "Next week shows lower risk if you implement the breathing protocol",
      watchFor: "Thursday may be challenging based on your 3-week cycle",
      encouragement: "You're getting better at reading your body's signals. Your pattern recognition has improved 25% this month!"
    }
  };
}

export default function WeeklyHealthBrief({ isOpen, onClose }: WeeklyHealthBriefProps) {
  // Use the real weekly brief hook
  const {
    brief: realBrief,
    isCurrentWeek,
    weekOf,
    isLoading,
    isError,
    hasBeenSeen,
    markAsOpened,
    dismissBrief,
    refreshBrief,
    briefsEnabled,
    setBriefsEnabled
  } = useWeeklyBrief();
  
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [currentSection, setCurrentSection] = useState(0);
  const [showPermanentDismiss, setShowPermanentDismiss] = useState(false);
  
  // Transform the real brief data to match the component's expected format
  const briefData = realBrief ? {
    greeting: realBrief.greeting,
    mainStory: {
      headline: realBrief.main_story.headline,
      narrative: realBrief.main_story.narrative,
      weekHighlights: realBrief.main_story.weekHighlights,
      inlineInsights: realBrief.main_story.inlineInsights
    },
    discoveries: realBrief.discoveries,
    experiments: realBrief.experiments,
    spotlight: realBrief.spotlight,
    weekStats: realBrief.week_stats,
    lookingAhead: realBrief.looking_ahead
  } : (!isLoading && !realBrief ? generateMockBriefData() : null);
  
  // Mark as opened when the modal is displayed
  useEffect(() => {
    if (isOpen && realBrief && !hasBeenSeen) {
      markAsOpened();
    }
  }, [isOpen, realBrief, hasBeenSeen, markAsOpened]);
  
  const toggleChecklistItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };
  
  const sections = ['Story', 'Discoveries', 'Experiments', 'Spotlight', 'Stats'];
  
  // Handle close with dismissal options
  const handleClose = () => {
    if (showPermanentDismiss) {
      dismissBrief(true);
    } else {
      dismissBrief(false);
    }
    onClose();
  };
  
  // Show loading state
  if (isLoading && isOpen) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-8 pointer-events-auto">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
                <p className="text-white">Loading your weekly health brief...</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
  
  // Show error state
  if (isError && isOpen) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-8 max-w-md pointer-events-auto">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Brief</h3>
                <p className="text-gray-400 mb-4">We couldn't fetch your weekly health brief. Please try again.</p>
                <div className="flex gap-2">
                  <button
                    onClick={refreshBrief}
                    className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-white/[0.05] text-gray-400 rounded-lg hover:bg-white/[0.08]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
  
  if (!briefData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/[0.08]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">{briefData.greeting.title}</h2>
                  <p className="text-gray-400">{briefData.greeting.subtitle}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {briefData.greeting.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Week of {format(weekOf ? parseISO(weekOf) : startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')}
                      {!isCurrentWeek && realBrief && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                          Previous Week
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Section tabs */}
              <div className="flex gap-2 mt-4">
                {sections.map((section, index) => (
                  <button
                    key={section}
                    onClick={() => setCurrentSection(index)}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      currentSection === index
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {currentSection === 0 && (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-semibold text-white mb-4">{briefData.mainStory.headline}</h3>
                    <div className="prose prose-invert max-w-none">
                      {briefData.mainStory.narrative.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="text-gray-300 mb-4 leading-relaxed">
                          {paragraph.split(/(\b(?:24-hour delay switch|inflammatory reaction|mitochondrial function)\b)/).map((part, j) => {
                            const insight = briefData.mainStory.inlineInsights.find(ins => ins.triggerText === part);
                            if (insight) {
                              return (
                                <span
                                  key={j}
                                  className="underline decoration-purple-500/50 cursor-pointer hover:text-purple-400 transition-colors"
                                  onClick={() => setExpandedInsight(expandedInsight === part ? null : part)}
                                >
                                  {part}
                                  {expandedInsight === part && (
                                    <span className="block mt-2 p-2 bg-purple-500/10 rounded-lg text-sm">
                                      {insight.expansion}
                                    </span>
                                  )}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      ))}
                    </div>
                    
                    {/* Week Highlights */}
                    <div className="mt-8 space-y-3">
                      <h4 className="text-sm font-medium text-gray-400 mb-4">Week Highlights</h4>
                      {briefData.mainStory.weekHighlights.map((highlight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`p-3 rounded-lg border ${
                            highlight.impact === 'positive' 
                              ? 'bg-green-500/5 border-green-500/20'
                              : highlight.impact === 'trigger'
                              ? 'bg-yellow-500/5 border-yellow-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{highlight.day}</p>
                              <p className="text-sm text-gray-300 mt-1">{highlight.event}</p>
                              <p className="text-xs text-gray-500 mt-2">{highlight.detail}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              highlight.impact === 'positive'
                                ? 'bg-green-500/20 text-green-400'
                                : highlight.impact === 'trigger'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {highlight.impact}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {currentSection === 1 && (
                  <motion.div
                    key="discoveries"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Primary Pattern */}
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-6">
                      <h4 className="text-lg font-semibold text-white mb-2">{briefData.discoveries.primaryPattern.title}</h4>
                      <p className="text-gray-300">{briefData.discoveries.primaryPattern.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="text-purple-400">
                          {Math.round(briefData.discoveries.primaryPattern.confidence * 100)}% confidence
                        </span>
                        <span className="text-gray-500">{briefData.discoveries.primaryPattern.evidence}</span>
                      </div>
                    </div>
                    
                    {/* Secondary Patterns */}
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Other Patterns</h4>
                    <div className="space-y-2 mb-6">
                      {briefData.discoveries.secondaryPatterns.map((pattern, i) => (
                        <div key={i} className="p-3 bg-white/[0.02] rounded-lg">
                          <p className="text-sm text-white">{pattern.pattern}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{pattern.frequency}</span>
                            {pattern.actionable && (
                              <span className="text-green-400">Actionable</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Comparison */}
                    <div className="p-4 bg-white/[0.02] rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-3">Compared to Last Week</h4>
                      <div className="text-2xl font-bold text-green-400 mb-3">
                        {briefData.discoveries.comparisonToLastWeek.overall}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Wins</p>
                          {briefData.discoveries.comparisonToLastWeek.wins.map((win, i) => (
                            <p key={i} className="text-xs text-green-400">✓ {win}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Challenges</p>
                          {briefData.discoveries.comparisonToLastWeek.challenges.map((challenge, i) => (
                            <p key={i} className="text-xs text-yellow-400">→ {challenge}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {currentSection === 2 && (
                  <motion.div
                    key="experiments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">{briefData.experiments.title}</h3>
                    
                    {/* Recommendations */}
                    <div className="space-y-4 mb-6">
                      {briefData.experiments.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-lg border ${
                            rec.priority === 'high'
                              ? 'bg-red-500/5 border-red-500/20'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-500/5 border-yellow-500/20'
                              : 'bg-green-500/5 border-green-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">{rec.experiment}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              rec.priority === 'high'
                                ? 'bg-red-500/20 text-red-400'
                                : rec.priority === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {rec.priority} priority
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{rec.rationale}</p>
                          <div className="p-2 bg-black/20 rounded-lg">
                            <p className="text-xs text-gray-300">
                              <span className="text-purple-400">How to:</span> {rec.howTo}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="text-purple-400">Track:</span> {rec.trackingMetric}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Checklist */}
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Weekly Checklist</h4>
                    <div className="space-y-2">
                      {briefData.experiments.weeklyChecklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg cursor-pointer hover:bg-white/[0.04]"
                        >
                          <input
                            type="checkbox"
                            checked={checkedItems.has(item.id)}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                          />
                          <span className={`text-sm ${checkedItems.has(item.id) ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {item.task}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {currentSection === 3 && (
                  <motion.div
                    key="spotlight"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-start gap-3 mb-4">
                        <BookOpen className="w-5 h-5 text-purple-400 mt-1" />
                        <h3 className="text-lg font-semibold text-white">{briefData.spotlight.title}</h3>
                      </div>
                      <div className="text-gray-300 whitespace-pre-line">{briefData.spotlight.content}</div>
                      
                      <div className="mt-4 p-3 bg-white/[0.05] rounded-lg">
                        <p className="text-sm text-gray-400">
                          {briefData.spotlight.learnMore.teaser}
                        </p>
                        {showLearnMore && (
                          <p className="text-sm text-gray-300 mt-2">
                            {briefData.spotlight.learnMore.fullContent}
                          </p>
                        )}
                        <button
                          onClick={() => setShowLearnMore(!showLearnMore)}
                          className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                        >
                          {showLearnMore ? 'Show less' : 'Learn more →'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {currentSection === 4 && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-white/[0.02] rounded-lg">
                        <p className="text-2xl font-bold text-white">{briefData.weekStats.symptomFreeDays}</p>
                        <p className="text-xs text-gray-400">Symptom-free days</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-lg">
                        <p className="text-sm font-medium text-green-400">{briefData.weekStats.bestDay}</p>
                        <p className="text-xs text-gray-400">Best day</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-lg">
                        <p className="text-sm font-medium text-red-400">{briefData.weekStats.worstDay}</p>
                        <p className="text-xs text-gray-400">Worst day</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-lg">
                        <div className="space-y-1">
                          {briefData.weekStats.trendsUp.map((trend, i) => (
                            <p key={i} className="text-xs text-green-400">↑ {trend}</p>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Improving</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-lg">
                        <div className="space-y-1">
                          {briefData.weekStats.trendsDown.map((trend, i) => (
                            <p key={i} className="text-xs text-yellow-400">↓ {trend}</p>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Needs attention</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-lg">
                        <p className="text-2xl font-bold text-white">
                          {briefData.weekStats.aiConsultations + briefData.weekStats.photosAnalyzed}
                        </p>
                        <p className="text-xs text-gray-400">AI analyses</p>
                      </div>
                    </div>
                    
                    {/* Looking Ahead */}
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Looking Ahead
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300">
                          <span className="text-purple-400">Prediction:</span> {briefData.lookingAhead.prediction}
                        </p>
                        <p className="text-sm text-gray-300">
                          <span className="text-yellow-400">Watch for:</span> {briefData.lookingAhead.watchFor}
                        </p>
                        <p className="text-sm text-green-400 mt-3">
                          💪 {briefData.lookingAhead.encouragement}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {sections.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          currentSection === i ? 'bg-purple-400' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  {briefsEnabled && (
                    <label className="flex items-center gap-2 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={showPermanentDismiss}
                        onChange={(e) => setShowPermanentDismiss(e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      Don't show weekly briefs anymore
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={refreshBrief}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 inline-block mr-1" />
                    Refresh
                  </button>
                  <button className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                    Share
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                  >
                    Done Reading
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}