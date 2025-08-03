'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleLeft, ToggleRight, Columns, Sliders, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';

interface PhotoData {
  id: string;
  url: string;
  date: string;
  label?: string;
}

interface ComparisonResult {
  trend: 'improving' | 'worsening' | 'stable';
  changes: {
    size?: { from: number; to: number; unit: string; change: number };
    color?: { description: string };
    texture?: { description: string };
  };
  summary: string;
  confidence: number;
}

interface PhotoComparisonViewProps {
  beforePhoto: PhotoData;
  afterPhoto: PhotoData;
  comparison?: ComparisonResult;
  additionalPhotos?: PhotoData[];
}

type ViewMode = 'toggle' | 'side-by-side' | 'timeline';

export default function PhotoComparisonView({
  beforePhoto,
  afterPhoto,
  comparison,
  additionalPhotos = []
}: PhotoComparisonViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('toggle');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showingAfter, setShowingAfter] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);

  const allPhotos = [beforePhoto, ...(additionalPhotos || []), afterPhoto];

  const getTrendIcon = () => {
    if (!comparison) return null;
    switch (comparison.trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'worsening':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTrendColor = () => {
    if (!comparison) return 'border-gray-600';
    switch (comparison.trend) {
      case 'improving':
        return 'border-green-500';
      case 'worsening':
        return 'border-red-500';
      case 'stable':
        return 'border-yellow-500';
    }
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Photo Comparison</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('toggle')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'toggle'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-white/[0.03] text-gray-400 hover:text-white'
            }`}
            title="Toggle View"
          >
            <ToggleLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-white/[0.03] text-gray-400 hover:text-white'
            }`}
            title="Side by Side"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'timeline'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-white/[0.03] text-gray-400 hover:text-white'
            }`}
            title="Timeline"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison Result Badge */}
      {comparison && (
        <div className="mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-sm font-medium text-white capitalize">
                {comparison.trend}
              </span>
              <span className="text-xs text-gray-400">
                ({Math.round(comparison.confidence * 100)}% confidence)
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {Math.abs(
                new Date(afterPhoto.date).getTime() - new Date(beforePhoto.date).getTime()
              ) / (1000 * 60 * 60 * 24)} days apart
            </span>
          </div>
          {comparison.summary && (
            <p className="text-sm text-gray-300 mt-2">{comparison.summary}</p>
          )}
        </div>
      )}

      {/* Toggle View */}
      {viewMode === 'toggle' && (
        <div className="relative">
          <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${getTrendColor()}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={showingAfter ? 'after' : 'before'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Image
                  src={showingAfter ? afterPhoto.url : beforePhoto.url}
                  alt={showingAfter ? 'After' : 'Before'}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="text-sm text-white font-medium">
                    {showingAfter ? 'After' : 'Before'}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="text-xs text-white">
                    {showingAfter ? afterPhoto.date : beforePhoto.date}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowingAfter(!showingAfter)}
            className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center justify-center gap-2"
          >
            {showingAfter ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            Toggle to {showingAfter ? 'Before' : 'After'}
          </motion.button>
        </div>
      )}

      {/* Side-by-Side View */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${getTrendColor()}`}>
              <Image
                src={beforePhoto.url}
                alt="Before"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                <span className="text-sm text-white font-medium">Before</span>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                <span className="text-xs text-white">{beforePhoto.date}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${getTrendColor()}`}>
              <Image
                src={afterPhoto.url}
                alt="After"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                <span className="text-sm text-white font-medium">After</span>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                <span className="text-xs text-white">{afterPhoto.date}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div>
          <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${getTrendColor()}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={allPhotos[timelineIndex].id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0"
              >
                <Image
                  src={allPhotos[timelineIndex].url}
                  alt={`Photo ${timelineIndex + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="text-sm text-white font-medium">
                    {timelineIndex === 0 ? 'Start' : timelineIndex === allPhotos.length - 1 ? 'Current' : `Day ${timelineIndex}`}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white">
                    {allPhotos[timelineIndex].date}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Timeline Slider */}
          <div className="mt-6">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={allPhotos.length - 1}
                value={timelineIndex}
                onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-white/[0.1] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${
                    (timelineIndex / (allPhotos.length - 1)) * 100
                  }%, rgba(255,255,255,0.1) ${
                    (timelineIndex / (allPhotos.length - 1)) * 100
                  }%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              
              {/* Timeline Markers */}
              <div className="absolute inset-x-0 top-0 flex justify-between pointer-events-none">
                {allPhotos.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full -mt-0.5 ${
                      index <= timelineIndex ? 'bg-orange-500' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Timeline Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Start</span>
              <span>{allPhotos.length - 2} follow-ups</span>
              <span>Current</span>
            </div>
          </div>
        </div>
      )}

      {/* Changes Details */}
      {comparison?.changes && Object.keys(comparison.changes).length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Observed Changes</h4>
          {comparison.changes.size && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
              <span className="text-sm text-gray-400">Size</span>
              <span className="text-sm text-white">
                {comparison.changes.size.from}{comparison.changes.size.unit} → {comparison.changes.size.to}{comparison.changes.size.unit}
                <span className={`ml-2 ${comparison.changes.size.change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ({comparison.changes.size.change > 0 ? '+' : ''}{comparison.changes.size.change}%)
                </span>
              </span>
            </div>
          )}
          {comparison.changes.color && (
            <div className="p-3 rounded-lg bg-white/[0.03]">
              <span className="text-sm text-gray-400">Color: </span>
              <span className="text-sm text-white">{comparison.changes.color.description}</span>
            </div>
          )}
          {comparison.changes.texture && (
            <div className="p-3 rounded-lg bg-white/[0.03]">
              <span className="text-sm text-gray-400">Texture: </span>
              <span className="text-sm text-white">{comparison.changes.texture.description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}