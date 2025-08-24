'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { PhotoProgressionData } from '@/lib/mock-health-data';
import { Camera, Calendar, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoProgressionSliderProps {
  data: PhotoProgressionData;
}

export default function PhotoProgressionSlider({ data }: PhotoProgressionSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSession, setSelectedSession] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };
  
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);
  
  const getImprovementColor = (improvement: number) => {
    if (improvement >= 40) return 'text-green-400';
    if (improvement >= 20) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  const getImprovementBadge = (improvement: number) => {
    if (improvement >= 40) return 'bg-green-500/20 border-green-500/30';
    if (improvement >= 20) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-orange-500/20 border-orange-500/30';
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Photo Progression Analysis</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              showAnnotations 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-white/[0.05] text-gray-400'
            }`}
          >
            {showAnnotations ? 'Hide' : 'Show'} Annotations
          </button>
        </div>
      </div>
      
      {/* Session Timeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Session Timeline</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSession(Math.max(0, selectedSession - 1))}
              disabled={selectedSession === 0}
              className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-xs text-gray-400">
              {selectedSession + 1} / {data.sessions.length}
            </span>
            <button
              onClick={() => setSelectedSession(Math.min(data.sessions.length - 1, selectedSession + 1))}
              disabled={selectedSession === data.sessions.length - 1}
              className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          {data.sessions.map((session, index) => (
            <motion.button
              key={session.id}
              onClick={() => setSelectedSession(index)}
              className={`flex-1 p-2 rounded-lg border transition-all ${
                selectedSession === index 
                  ? 'bg-purple-500/20 border-purple-500/50' 
                  : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3 h-3 text-gray-400" />
                <div className="text-left flex-1">
                  <p className="text-xs text-white">
                    {format(new Date(session.date), 'MMM d')}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Comparison Slider */}
      <div className="relative">
        <div 
          className="relative h-96 bg-black/50 rounded-lg overflow-hidden cursor-col-resize select-none"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Before Image */}
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Before Photo</p>
                <p className="text-xs text-gray-600 mt-1">
                  {format(new Date(data.comparison.beforePhoto.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {showAnnotations && (
              <div className="absolute top-4 left-4 space-y-2">
                {data.comparison.beforePhoto.annotations.map((annotation, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-lg"
                  >
                    <p className="text-xs text-red-400">{annotation}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {/* After Image (overlay) */}
          <div 
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-blue-900/20 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">After Photo</p>
                <p className="text-xs text-gray-600 mt-1">
                  {format(new Date(data.comparison.afterPhoto.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {showAnnotations && (
              <div className="absolute top-4 right-4 space-y-2">
                {data.comparison.afterPhoto.annotations.map((annotation, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg"
                  >
                    <p className="text-xs text-green-400">{annotation}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <ChevronLeft className="w-3 h-3 text-black absolute -left-0.5" />
              <ChevronRight className="w-3 h-3 text-black absolute -right-0.5" />
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
            <p className="text-xs text-white font-medium">Before</p>
          </div>
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
            <p className="text-xs text-white font-medium">After</p>
          </div>
        </div>
        
        {/* Improvement Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className={`absolute bottom-4 right-4 px-3 py-2 rounded-lg border ${getImprovementBadge(data.comparison.improvement)}`}
        >
          <p className={`text-2xl font-bold ${getImprovementColor(data.comparison.improvement)}`}>
            +{data.comparison.improvement}%
          </p>
          <p className="text-xs text-gray-400">Improvement</p>
        </motion.div>
      </div>
      
      {/* AI Analysis */}
      <div className="mt-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Camera className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white mb-1">AI Analysis</h4>
            <p className="text-xs text-gray-400">{data.comparison.aiAnalysis}</p>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>Drag the slider to compare before/after</span>
        <span>•</span>
        <span>Click timeline to view different sessions</span>
      </div>
    </div>
  );
}