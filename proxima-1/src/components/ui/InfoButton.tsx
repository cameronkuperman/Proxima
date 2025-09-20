'use client';

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoButtonProps {
  content: string;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  alignRight?: boolean; // For rightmost items to prevent cutoff
}

export default function InfoButton({ content, className = '', position = 'bottom', alignRight = false }: InfoButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimer, setShowTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    setShowTimer(timer);
  };

  const handleMouseLeave = () => {
    if (showTimer) {
      clearTimeout(showTimer);
      setShowTimer(null);
    }
    setIsVisible(false);
  };

  // Hide tooltip when tab loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        if (showTimer) {
          clearTimeout(showTimer);
          setShowTimer(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (showTimer) {
        clearTimeout(showTimer);
      }
    };
  }, [showTimer]);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2 right-0 sm:right-auto sm:left-0';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        // Position above, align right for edge items to prevent cutoff
        // Responsive alignment for different screen sizes
        return alignRight 
          ? 'bottom-full mb-1 right-0 md:right-0 lg:right-0' 
          : 'bottom-full mb-1 left-3 md:left-4 lg:left-4';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={(e) => e.stopPropagation()}
        className={`p-1 rounded-full hover:bg-white/[0.05] transition-colors ${className}`}
      >
        <Info className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute z-[9999] ${getPositionStyles()}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ 
              pointerEvents: 'none',
              // Ensure tooltip stays within viewport
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }}
          >
            <div className="px-5 py-3.5 text-sm text-white bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 min-w-[320px] max-w-[500px] lg:max-w-[420px] xl:max-w-[500px] overflow-visible">
              <div className="whitespace-normal break-words leading-relaxed overflow-visible">
                {content}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}