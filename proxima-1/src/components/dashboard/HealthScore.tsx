'use client';

import React from 'react';
import { useHealthScore } from '@/hooks/useHealthScore';
import { RefreshCw, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HealthScore() {
  const { scoreData, isLoading, error, fetchHealthScore, isRefreshing } = useHealthScore();

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 75) return '#3B82F6'; // blue  
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getScoreCategory = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  if (isLoading && !scoreData) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-32 w-32 bg-white/[0.05] rounded-full mx-auto"></div>
            <div className="h-4 bg-white/[0.05] rounded w-2/3 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-12 bg-white/[0.05] rounded"></div>
              <div className="h-12 bg-white/[0.05] rounded"></div>
              <div className="h-12 bg-white/[0.05] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !scoreData) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-400 text-center">{error}</p>
          <button
            onClick={() => fetchHealthScore()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const scoreColor = getScoreColor(scoreData.score);
  const scoreCategory = getScoreCategory(scoreData.score);

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Your Health Score</h2>
        <button
          onClick={() => fetchHealthScore(true)}
          disabled={isRefreshing}
          className="p-2 hover:bg-white/[0.05] rounded-lg transition-all disabled:opacity-50"
          title="Refresh Score"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Score Display */}
      <div className="text-center mb-6">
        <motion.div
          className="relative w-32 h-32 mx-auto mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Score Circle Background */}
          <svg className="absolute inset-0 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/[0.05]"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke={scoreColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: scoreData.score / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                strokeDasharray: `${2 * Math.PI * 56}`,
                strokeDashoffset: `${2 * Math.PI * 56 * (1 - scoreData.score / 100)}`,
              }}
            />
          </svg>
          
          {/* Score Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className="text-4xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {scoreData.score}
            </motion.div>
            <div className="text-sm text-gray-400">/100</div>
          </div>
        </motion.div>

        {/* Score Category */}
        <motion.div
          className="text-lg font-medium"
          style={{ color: scoreColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {scoreCategory}
        </motion.div>

        {/* Reasoning */}
        {scoreData.reasoning && (
          <motion.p
            className="text-sm text-gray-400 mt-2 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {scoreData.reasoning}
          </motion.p>
        )}
      </div>

      {/* Today's Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Today's Actions</h3>
        <AnimatePresence>
          {scoreData.actions.map((action, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.05] hover:bg-white/[0.03] transition-all group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{action.icon}</span>
              <span className="text-sm text-gray-300 flex-1">{action.text}</span>
              <button
                className="w-5 h-5 rounded border border-white/[0.2] flex items-center justify-center hover:bg-white/[0.1] transition-all opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  const button = e.currentTarget;
                  button.classList.toggle('bg-green-500/20');
                  button.classList.toggle('border-green-500');
                  const hasCheck = button.querySelector('svg');
                  if (hasCheck) {
                    hasCheck.remove();
                  } else {
                    button.innerHTML = '<svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
                  }
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs">
        <div className="text-gray-500">
          {scoreData.cached && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Cached result
            </span>
          )}
        </div>
        {scoreData.expires_at && (
          <div className="text-gray-500">
            Next update: {new Date(scoreData.expires_at).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}