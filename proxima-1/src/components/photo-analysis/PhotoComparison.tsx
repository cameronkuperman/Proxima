'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns, Square, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface Photo {
  url?: string;
  date: string;
  label: string;
}

interface PhotoComparisonProps {
  beforePhoto?: Photo;
  afterPhoto?: Photo;
  className?: string;
}

export default function PhotoComparison({
  beforePhoto,
  afterPhoto,
  className = ''
}: PhotoComparisonProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSwapped, setIsSwapped] = useState(false);

  // Don't render if we don't have both photos
  if (!beforePhoto?.url || !afterPhoto?.url) {
    return null;
  }

  const leftPhoto = isSwapped ? afterPhoto : beforePhoto;
  const rightPhoto = isSwapped ? beforePhoto : afterPhoto;

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className={`relative ${className}`}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-400">Photo Comparison</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwapped(!isSwapped)}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
            title="Swap photos"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex bg-white/[0.05] rounded-lg p-1">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'slider'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'side-by-side' ? (
          <motion.div
            key="side-by-side"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Before Photo */}
            <div className="relative">
              <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/70 rounded-lg text-xs text-white">
                {leftPhoto.label}
              </div>
              <img
                src={leftPhoto.url}
                alt={leftPhoto.label}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/70 px-2 py-1 rounded">
                {leftPhoto.date}
              </div>
            </div>

            {/* After Photo */}
            <div className="relative">
              <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/70 rounded-lg text-xs text-white">
                {rightPhoto.label}
              </div>
              <img
                src={rightPhoto.url}
                alt={rightPhoto.label}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/70 px-2 py-1 rounded">
                {rightPhoto.date}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="slider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-lg cursor-ew-resize"
            onMouseMove={handleSliderMove}
          >
            {/* After Photo (Full) */}
            <img
              src={afterPhoto.url}
              alt={afterPhoto.label}
              className="w-full h-full object-cover"
            />

            {/* Before Photo (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforePhoto.url}
                alt={beforePhoto.label}
                className="w-full h-full object-cover"
                style={{ minWidth: '100%' }}
              />
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ChevronLeft className="w-3 h-3 text-gray-800" />
                <ChevronRight className="w-3 h-3 text-gray-800" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 rounded-lg text-xs text-white">
              {beforePhoto.label}
            </div>
            <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 rounded-lg text-xs text-white">
              {afterPhoto.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center mt-2">
        {viewMode === 'slider' 
          ? 'Drag the slider to compare photos'
          : 'Click the icons above to change view mode'
        }
      </p>
    </div>
  );
}