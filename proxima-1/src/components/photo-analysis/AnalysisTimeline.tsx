'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export interface TimelineAnalysis {
  id: string;
  date: string;
  photo_url?: string;
  thumbnail_url?: string;
  primary_assessment: string;
  confidence: number;
  key_metrics?: {
    size_mm?: number;
  };
  has_red_flags?: boolean;
  trend?: 'improving' | 'stable' | 'worsening';
}

interface AnalysisTimelineProps {
  analyses: TimelineAnalysis[];
  currentIndex: number;
  onSelectAnalysis: (index: number) => void;
  className?: string;
}

export default function AnalysisTimeline({
  analyses,
  currentIndex,
  onSelectAnalysis,
  className = ''
}: AnalysisTimelineProps) {
  // Don't render if there are no analyses or only one
  if (!analyses || analyses.length <= 1) {
    return null;
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-3 h-3 text-green-400" />;
      case 'worsening':
        return <TrendingUp className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-400">Analysis History</h3>
        <span className="text-xs text-gray-500">
          ({currentIndex + 1} of {analyses.length})
        </span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-800" />

        {/* Timeline Points */}
        <div className="relative flex justify-between">
          {analyses.map((analysis, index) => {
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <motion.div
                key={analysis.id}
                className="relative group cursor-pointer"
                onClick={() => onSelectAnalysis(index)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Timeline Dot */}
                <div
                  className={`
                    relative w-8 h-8 rounded-full border-2 transition-all duration-300
                    ${isActive 
                      ? 'border-orange-500 bg-orange-500/20' 
                      : isPast
                      ? 'border-gray-600 bg-gray-800'
                      : 'border-gray-700 bg-gray-900'
                    }
                  `}
                >
                  {/* Confidence Indicator */}
                  <div
                    className={`
                      absolute inset-1 rounded-full 
                      ${getConfidenceColor(analysis.confidence)}
                      ${isActive ? 'opacity-100' : 'opacity-30'}
                    `}
                  />
                  
                  {/* Red Flag Indicator */}
                  {analysis.has_red_flags && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </div>

                {/* Hover Tooltip */}
                <div className={`
                  absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                  bg-gray-900 border border-gray-800 rounded-lg p-3 
                  opacity-0 group-hover:opacity-100 transition-opacity
                  pointer-events-none z-10 w-48
                  ${index === 0 ? 'left-0 translate-x-0' : ''}
                  ${index === analyses.length - 1 ? 'left-auto right-0 translate-x-0' : ''}
                `}>
                  {/* Thumbnail */}
                  {(analysis.thumbnail_url || analysis.photo_url) && (
                    <div className="w-full h-20 mb-2 rounded overflow-hidden bg-gray-800">
                      <img
                        src={analysis.thumbnail_url || analysis.photo_url}
                        alt={analysis.primary_assessment}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <p className="text-xs font-medium text-white mb-1">
                    {new Date(analysis.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    {analysis.primary_assessment}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(analysis.trend)}
                      <span className="text-xs text-gray-400">
                        {analysis.key_metrics?.size_mm 
                          ? `${analysis.key_metrics.size_mm}mm` 
                          : 'No size data'
                        }
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {analysis.confidence}% conf
                    </span>
                  </div>
                  
                  {analysis.has_red_flags && (
                    <div className="mt-2 flex items-center gap-1 text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">Has red flags</span>
                    </div>
                  )}
                </div>

                {/* Date Label (for first, last, and current) */}
                {(index === 0 || index === analyses.length - 1 || isActive) && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <p className="text-xs text-gray-500">
                      {new Date(analysis.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Hint */}
      <p className="text-xs text-gray-500 text-center mt-6">
        Click any point to view that analysis • Use arrow keys to navigate
      </p>
    </div>
  );
}