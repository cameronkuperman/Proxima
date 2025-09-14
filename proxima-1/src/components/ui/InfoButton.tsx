'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoButtonProps {
  content: string;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function InfoButton({ content, className = '', position = 'bottom' }: InfoButtonProps) {
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

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2 right-0';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-full mb-2 left-0';
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
            className={`absolute z-[100] ${getPositionStyles()}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ pointerEvents: 'none' }}
          >
            <div className="px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-xl border border-gray-800 min-w-[200px] max-w-[400px] overflow-visible">
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