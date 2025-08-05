'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Activity, Palette, Shapes, Sparkles, Eye } from 'lucide-react';
import { VisualComparison, KeyMeasurements } from '@/types/photo-analysis';

interface EnhancedComparisonViewProps {
  comparison: VisualComparison;
  measurements?: KeyMeasurements;
  daysSinceLast: number;
}

export default function EnhancedComparisonView({
  comparison,
  measurements,
  daysSinceLast
}: EnhancedComparisonViewProps) {
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'critical': return 'from-red-500 to-pink-500';
      case 'significant': return 'from-orange-500 to-red-500';
      case 'moderate': return 'from-yellow-500 to-orange-500';
      default: return 'from-green-500 to-emerald-500';
    }
  };

  const getSignificanceBadgeColor = (significance: string) => {
    switch (significance) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'significant': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getRateOfChangeIcon = (rate: string) => {
    switch (rate) {
      case 'rapid': return <Activity className="w-4 h-4 text-red-400" />;
      case 'moderate': return <Activity className="w-4 h-4 text-yellow-400" />;
      case 'slow': return <Activity className="w-4 h-4 text-green-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-[20px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Progress Comparison</h3>
          <span className="text-sm text-gray-400">{daysSinceLast} days apart</span>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSignificanceBadgeColor(comparison.change_significance)}`}>
            {comparison.change_significance} change
          </span>
          {getRateOfChangeIcon(comparison.progression_analysis.rate_of_change)}
          <span className="text-sm text-gray-300">
            {comparison.progression_analysis.rate_of_change} progression
          </span>
        </div>
        
        <p className="text-white font-medium">{comparison.primary_change}</p>
      </div>

      {/* Visual Changes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Size Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="font-medium text-white">Size Change</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-white">
                {comparison.visual_changes.size.estimated_change_percent > 0 ? '+' : ''}
                {comparison.visual_changes.size.estimated_change_percent}%
              </p>
              <p className="text-sm text-gray-400">{comparison.visual_changes.size.description}</p>
            </div>
            
            {measurements && (
              <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-sm text-gray-300">
                  Current: {measurements.latest.size_estimate_mm}mm
                </p>
                <p className="text-xs text-gray-500">
                  {measurements.latest.size_reference}
                </p>
              </div>
            )}
            
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Clinical Relevance</p>
              <p className="text-sm text-gray-300">{comparison.visual_changes.size.clinical_relevance}</p>
            </div>
          </div>
        </motion.div>

        {/* Color Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="font-medium text-white">Color Changes</h4>
            {comparison.visual_changes.color.concerning && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-300">{comparison.visual_changes.color.description}</p>
            
            {comparison.visual_changes.color.areas_affected.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Areas Affected:</p>
                <div className="flex flex-wrap gap-2">
                  {comparison.visual_changes.color.areas_affected.map((area, i) => (
                    <span key={i} className="px-2 py-1 bg-white/[0.05] rounded text-xs text-gray-300">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {measurements && (
              <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-sm text-gray-300">
                  Primary: {measurements.latest.primary_color}
                </p>
                {measurements.latest.secondary_colors.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Also: {measurements.latest.secondary_colors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Shape Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shapes className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-medium text-white">Shape & Border</h4>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-300">{comparison.visual_changes.shape.description}</p>
            
            {comparison.visual_changes.shape.symmetry_change && (
              <div>
                <p className="text-xs text-gray-400">Symmetry:</p>
                <p className="text-sm text-gray-300">{comparison.visual_changes.shape.symmetry_change}</p>
              </div>
            )}
            
            {comparison.visual_changes.shape.border_changes.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Border Changes:</p>
                <ul className="space-y-1">
                  {comparison.visual_changes.shape.border_changes.map((change, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-1">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>

        {/* Texture Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
            <h4 className="font-medium text-white">Texture & Surface</h4>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-300">{comparison.visual_changes.texture.description}</p>
            
            {comparison.visual_changes.texture.new_features.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">New Features:</p>
                <ul className="space-y-1">
                  {comparison.visual_changes.texture.new_features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-1">
                      <span className="text-pink-400 mt-0.5">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {measurements && (
              <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-sm text-gray-300">{measurements.latest.texture_description}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Clinical Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-[20px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/[0.05] rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-purple-400" />
          <h4 className="font-medium text-purple-400">Clinical Interpretation</h4>
        </div>
        <p className="text-white leading-relaxed">{comparison.clinical_interpretation}</p>
      </motion.div>

      {/* Progression Analysis */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h4 className="font-medium text-white mb-4">Progression Analysis</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Overall Trend</p>
            <p className="text-lg font-semibold text-white">{comparison.progression_analysis.overall_trend}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white">{comparison.progression_analysis.confidence_in_trend}%</p>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${comparison.progression_analysis.confidence_in_trend}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${getSignificanceColor(comparison.change_significance)}`}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/[0.03] rounded-lg p-4">
          <p className="text-sm font-medium text-white mb-2">Key Finding</p>
          <p className="text-gray-300">{comparison.progression_analysis.key_finding}</p>
        </div>
      </div>

      {/* Next Monitoring Recommendations */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h4 className="font-medium text-white mb-4">Next Monitoring Recommendations</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">Optimal Follow-up</p>
            <p className="text-2xl font-bold text-orange-400">
              {comparison.next_monitoring.optimal_interval_days} days
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-2">Focus Areas</p>
            <ul className="space-y-1">
              {comparison.next_monitoring.focus_areas.map((area, i) => (
                <li key={i} className="text-sm text-gray-300">• {area}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-2">Red Flags to Watch</p>
            <ul className="space-y-1">
              {comparison.next_monitoring.red_flags_to_watch.map((flag, i) => (
                <li key={i} className="text-sm text-red-400">• {flag}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {measurements && measurements.condition_insights && (
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <p className="text-xs text-gray-400 mb-2">Photo Tips for Better Tracking</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">Angle:</span> {measurements.condition_insights.optimal_photo_angle}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">Lighting:</span> {measurements.condition_insights.optimal_lighting}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}