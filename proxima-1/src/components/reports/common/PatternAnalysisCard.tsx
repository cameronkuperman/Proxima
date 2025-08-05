'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  Clock,
  Cloud,
  Sun,
  Moon,
  Zap,
  Coffee,
  AlertCircle,
  Activity,
  ThermometerSun,
  Droplets,
  Wind,
  Brain,
  ChevronDown,
  ChevronRight,
  Target,
  BarChart3
} from 'lucide-react';

interface PatternAnalysisData {
  frequency?: string;
  triggers?: string[];
  alleviating_factors?: string[];
  progression?: string;
  correlation_factors?: string[];
  peak_times?: string[];
  seasonal_trends?: string;
  frequency_trend?: string;
  severity_trend?: string;
}

interface PatternAnalysisCardProps {
  data: PatternAnalysisData;
  specialty?: string;
  className?: string;
}

// Icons for different trigger types
const triggerIcons: Record<string, any> = {
  'stress': Brain,
  'weather': Cloud,
  'sleep': Moon,
  'diet': Coffee,
  'exercise': Activity,
  'heat': ThermometerSun,
  'cold': Wind,
  'humidity': Droplets,
  'light': Sun,
  'morning': Sun,
  'evening': Moon,
  'afternoon': Sun,
  'night': Moon,
  default: Zap
};

export const PatternAnalysisCard: React.FC<PatternAnalysisCardProps> = ({
  data,
  specialty,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getTriggerIcon = (trigger: string) => {
    const lowerTrigger = trigger.toLowerCase();
    for (const [key, icon] of Object.entries(triggerIcons)) {
      if (lowerTrigger.includes(key)) {
        return icon;
      }
    }
    return triggerIcons.default;
  };

  const getProgressionColor = (progression: string) => {
    const lower = progression.toLowerCase();
    if (lower.includes('improving') || lower.includes('better')) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (lower.includes('worsening') || lower.includes('worse')) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (lower.includes('stable') || lower.includes('unchanged')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const hasData = Object.values(data).some(value => 
    value && (Array.isArray(value) ? value.length > 0 : true)
  );

  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-200">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-purple-700" />
          <h2 className="text-xl font-bold text-gray-900">Pattern Analysis</h2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Pattern Overview */}
        <div>
          <button
            onClick={() => toggleSection('main')}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              Symptom Patterns
            </h3>
            {expandedSections.has('main') ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('main') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                {/* Frequency & Progression */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.frequency && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Frequency</h4>
                      </div>
                      <p className="text-blue-800">{data.frequency}</p>
                    </div>
                  )}

                  {data.progression && (
                    <div className={`rounded-lg p-4 border ${getProgressionColor(data.progression)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <h4 className="font-semibold">Progression</h4>
                      </div>
                      <p>{data.progression}</p>
                    </div>
                  )}
                </div>

                {/* Trends */}
                {(data.frequency_trend || data.severity_trend) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-gray-600" />
                      Trends Over Time
                    </h4>
                    <div className="space-y-2">
                      {data.frequency_trend && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          <span className={`font-medium ${
                            data.frequency_trend.toLowerCase().includes('decreas') ? 'text-green-600' :
                            data.frequency_trend.toLowerCase().includes('increas') ? 'text-red-600' :
                            'text-gray-700'
                          }`}>
                            {data.frequency_trend}
                          </span>
                        </div>
                      )}
                      {data.severity_trend && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Severity:</span>
                          <span className={`font-medium ${
                            data.severity_trend.toLowerCase().includes('decreas') ? 'text-green-600' :
                            data.severity_trend.toLowerCase().includes('increas') ? 'text-red-600' :
                            'text-gray-700'
                          }`}>
                            {data.severity_trend}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Triggers */}
        {data.triggers && data.triggers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Identified Triggers
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.triggers.map((trigger, idx) => {
                const Icon = getTriggerIcon(trigger);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-800 rounded-lg border border-red-200"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{trigger}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alleviating Factors */}
        {data.alleviating_factors && data.alleviating_factors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              What Helps
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.alleviating_factors.map((factor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-800 rounded-lg border border-green-200"
                >
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">{factor}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Peak Times */}
        {data.peak_times && data.peak_times.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Peak Symptom Times
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.peak_times.map((time, idx) => {
                const Icon = getTriggerIcon(time);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <Icon className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-800 font-medium">{time}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Seasonal Trends */}
        {data.seasonal_trends && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <ThermometerSun className="w-5 h-5" />
              Seasonal Patterns
            </h4>
            <p className="text-yellow-800">{data.seasonal_trends}</p>
          </div>
        )}

        {/* Correlation Factors */}
        {data.correlation_factors && data.correlation_factors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Correlated Factors
            </h3>
            <div className="space-y-2">
              {data.correlation_factors.map((factor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5" />
                  <span className="text-indigo-800">{factor}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};