'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { FollowUpSuggestion, ProgressionSummary, AdaptiveScheduling } from '@/types/photo-analysis';

interface AdaptiveSchedulingCardProps {
  suggestion: FollowUpSuggestion & {
    progression_summary?: ProgressionSummary;
    adaptive_scheduling?: AdaptiveScheduling;
  };
  onSchedule?: () => void;
  onSetReminder?: () => void;
}

export default function AdaptiveSchedulingCard({
  suggestion,
  onSchedule,
  onSetReminder
}: AdaptiveSchedulingCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'from-red-500 to-pink-500';
      case 'important': return 'from-orange-500 to-red-500';
      default: return 'from-green-500 to-emerald-500';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'important': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getPhaseIcon = (phase?: string) => {
    switch (phase) {
      case 'initial': return '🌱';
      case 'active_monitoring': return '👁️';
      case 'maintenance': return '✅';
      default: return '📊';
    }
  };

  const nextFollowUpDate = new Date();
  nextFollowUpDate.setDate(nextFollowUpDate.getDate() + suggestion.suggested_interval_days);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-[20px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/[0.05] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Next Follow-up Recommendation</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityBadgeColor(suggestion.priority)}`}>
            {suggestion.priority}
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{suggestion.suggested_interval_days}</p>
            <p className="text-sm text-gray-400">days</p>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-300 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Recommended date: {nextFollowUpDate.toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-gray-400">{suggestion.reasoning}</p>
          </div>
        </div>
      </div>

      {/* Progression Summary */}
      {suggestion.progression_summary && (
        <div className="p-6 border-b border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase">Progression Overview</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Trend</p>
              <p className="font-semibold text-white">{suggestion.progression_summary.trend}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Rate</p>
              <p className="font-semibold text-white">{suggestion.progression_summary.rate_of_change}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Analyses</p>
              <p className="font-semibold text-white">{suggestion.progression_summary.total_analyses}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Red Flags</p>
              <p className={`font-semibold ${suggestion.progression_summary.red_flags_total > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {suggestion.progression_summary.red_flags_total}
              </p>
            </div>
          </div>
          
          <div className="bg-white/[0.03] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getPhaseIcon(suggestion.progression_summary.phase)}</span>
              <span className="text-sm font-medium text-white">
                Current Phase: {suggestion.progression_summary.phase?.replace(/_/g, ' ')}
              </span>
            </div>
            
            {suggestion.progression_summary.key_factors.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Key monitoring factors:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestion.progression_summary.key_factors.map((factor, i) => (
                    <span key={i} className="px-2 py-1 bg-white/[0.05] rounded text-xs text-gray-300">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adaptive Scheduling */}
      {suggestion.adaptive_scheduling && (
        <div className="p-6 border-b border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase flex items-center gap-2">
            <Info className="w-4 h-4" />
            Intelligent Scheduling
          </h4>
          
          <div className="bg-white/[0.03] rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-2">
              Interval adjusted from baseline based on your condition's progression
            </p>
            
            {suggestion.adaptive_scheduling.adjust_based_on.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Adjustments based on:</p>
                <ul className="space-y-1">
                  {suggestion.adaptive_scheduling.adjust_based_on.map((factor, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-1">
                      <TrendingUp className="w-3 h-3 text-purple-400 mt-0.5" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits */}
      {suggestion.benefits_from_tracking && (
        <div className="p-6 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <AlertCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-1">Tracking Recommended</h4>
              <p className="text-sm text-gray-300">
                This condition would benefit from regular photo tracking to monitor progression
                and catch any changes early.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        <div className="flex gap-3">
          {onSetReminder && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSetReminder}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Set Reminder
            </motion.button>
          )}
          
          {onSchedule && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSchedule}
              className="flex-1 py-3 rounded-lg bg-white/[0.05] text-gray-300 hover:bg-white/[0.08] transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Now
            </motion.button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-3">
          You can always adjust this schedule based on how you're feeling
        </p>
      </div>
    </motion.div>
  );
}