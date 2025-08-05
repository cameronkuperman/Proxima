'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ZoomIn, ZoomOut, Loader } from 'lucide-react';

interface PhotoDisplayProps {
  photoUrl?: string;
  thumbnailUrl?: string;
  alt: string;
  date?: string;
  className?: string;
  showControls?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function PhotoDisplay({
  photoUrl,
  thumbnailUrl,
  alt,
  date,
  className = '',
  showControls = true,
  onLoad,
  onError
}: PhotoDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  // If no photo URL, don't render anything
  if (!photoUrl && !thumbnailUrl) {
    return null;
  }

  const displayUrl = photoUrl || thumbnailUrl;

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  };

  if (hasError) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-400">Unable to load photo</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Thumbnail/Collapsed View */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative cursor-pointer group"
          onClick={() => setIsExpanded(true)}
        >
          <div className="relative overflow-hidden rounded-lg bg-gray-800/50">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}
            <img
              src={displayUrl}
              alt={alt}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: isLoading ? 0 : 1 }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs text-white">{date}</span>
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-lg bg-gray-900/80 backdrop-blur-sm">
              {/* Controls */}
              {showControls && (
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                    disabled={imageScale <= 0.5}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                    disabled={imageScale >= 3}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image */}
              <div className="relative overflow-hidden" style={{ maxHeight: '60vh' }}>
                <motion.img
                  src={displayUrl}
                  alt={alt}
                  className="w-full h-full object-contain"
                  animate={{ scale: imageScale }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{ transformOrigin: 'center' }}
                  draggable={false}
                />
              </div>

              {/* Info Bar */}
              {date && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-sm text-white">{date}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}