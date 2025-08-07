'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ZoomIn, ZoomOut, Loader, Lock } from 'lucide-react';
import { usePhotoUrl } from '@/hooks/queries/usePhotoQueries';

interface PhotoDisplayV2Props {
  photoPath?: string; // Storage path for Supabase
  photoUrl?: string; // Direct URL (for backward compatibility)
  thumbnailUrl?: string;
  alt: string;
  date?: string;
  className?: string;
  showControls?: boolean;
  isSensitive?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function PhotoDisplayV2({
  photoPath,
  photoUrl: directUrl,
  thumbnailUrl,
  alt,
  date,
  className = '',
  showControls = true,
  isSensitive = false,
  onLoad,
  onError
}: PhotoDisplayV2Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [showSensitive, setShowSensitive] = useState(false);
  
  // Use React Query to get signed URL if photoPath is provided
  const { data: signedUrl, isLoading: urlLoading } = usePhotoUrl(photoPath || null);
  
  // Determine which URL to use
  const displayUrl = signedUrl || directUrl || thumbnailUrl;
  
  // If sensitive and not showing, display placeholder
  if (isSensitive && !showSensitive) {
    return (
      <div className={`relative ${className}`}>
        <div className="backdrop-blur-[20px] bg-gray-800/50 rounded-lg p-8 text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sensitive Content</h3>
          <p className="text-sm text-gray-400 mb-4">
            This photo contains sensitive medical content
          </p>
          <button
            onClick={() => setShowSensitive(true)}
            className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors"
          >
            View Photo
          </button>
        </div>
      </div>
    );
  }

  // If no photo URL available
  if (!displayUrl && !urlLoading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-400">Photo not available</p>
      </div>
    );
  }

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
        {photoPath && (
          <p className="text-xs text-gray-500 mt-1">
            The photo URL may have expired. Please refresh the page.
          </p>
        )}
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
            {(isLoading || urlLoading) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}
            {displayUrl && (
              <img
                src={displayUrl}
                alt={alt}
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: isLoading ? 0 : 1 }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy" // Lazy load for performance
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs text-white">{date}</span>
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Sensitive badge if applicable */}
            {isSensitive && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
                Sensitive
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Expanded View Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Controls */}
              {showControls && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors"
                    disabled={imageScale <= 0.5}
                  >
                    <ZoomOut className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors"
                    disabled={imageScale >= 3}
                  >
                    <ZoomIn className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <EyeOff className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Image */}
              <div className="relative overflow-auto">
                {displayUrl && (
                  <img
                    src={displayUrl}
                    alt={alt}
                    className="transition-transform duration-300"
                    style={{ transform: `scale(${imageScale})` }}
                  />
                )}
              </div>

              {/* Info */}
              {date && (
                <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/50 backdrop-blur rounded-lg">
                  <span className="text-sm text-white">{date}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}