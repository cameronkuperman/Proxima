'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SummaryNotificationProps {
  isGenerating: boolean;
  success?: boolean;
  error?: string;
}

export function SummaryNotification({ isGenerating, success, error }: SummaryNotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isGenerating || success || error) {
      setShow(true);
      
      // Auto-hide success notifications after 3 seconds
      if (success && !isGenerating) {
        const timer = setTimeout(() => setShow(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isGenerating, success, error]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`
            px-6 py-4 rounded-lg shadow-lg backdrop-blur-md border
            ${isGenerating ? 'bg-purple-500/20 border-purple-500/30' : ''}
            ${success ? 'bg-green-500/20 border-green-500/30' : ''}
            ${error ? 'bg-red-500/20 border-red-500/30' : ''}
          `}>
            <div className="flex items-center gap-3">
              {isGenerating && (
                <>
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-purple-500/30 rounded-full" />
                    <motion.div
                      className="absolute inset-0 w-5 h-5 border-2 border-purple-500 rounded-full border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-300">Generating Summary</p>
                    <p className="text-xs text-purple-400/80">Analyzing your conversation...</p>
                  </div>
                </>
              )}

              {success && !isGenerating && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-green-300">Summary Generated</p>
                    <p className="text-xs text-green-400/80">Your conversation has been analyzed</p>
                  </div>
                </>
              )}

              {error && !isGenerating && (
                <>
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-300">Summary Failed</p>
                    <p className="text-xs text-red-400/80">{error}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}