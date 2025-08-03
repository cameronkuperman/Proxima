'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'body' | 'general';
}

export default function AssessmentModal({ isOpen, onClose, type }: AssessmentModalProps) {
  const router = useRouter();

  const handleOptionClick = (mode: 'flash' | 'quick' | 'deep') => {
    const source = type === 'general' ? 'general' : 'body';
    router.push(`/scan?mode=${mode}&source=${source}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-[#0a0a0a] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {type === 'body' ? 'Select Analysis Depth' : 'Choose Assessment Type'}
              </h2>
              <p className="text-gray-400">
                {type === 'body' 
                  ? 'Choose how thorough you want your analysis to be'
                  : 'Select the assessment that best fits your needs'}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Flash Assessment - Only for General */}
              {type === 'general' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleOptionClick('flash')}
                  className="relative cursor-pointer group"
                >
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.1] transition-all">
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                        New
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-600/20 to-yellow-600/20 flex items-center justify-center flex-shrink-0 group-hover:from-amber-600/30 group-hover:to-yellow-600/30 transition-all">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">Flash Assessment</h3>
                        <p className="text-gray-400 text-sm mb-2">10-second instant AI response</p>
                        <p className="text-xs text-gray-500">Get immediate insights from a single question</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Scan */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: type === 'general' ? 0.2 : 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleOptionClick('quick')}
                className="relative cursor-pointer group"
              >
                <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.1] transition-all">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-600/20 to-green-600/20 flex items-center justify-center flex-shrink-0 group-hover:from-emerald-600/30 group-hover:to-green-600/30 transition-all">
                      <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Quick Scan</h3>
                      <p className="text-gray-400 text-sm mb-2">30-45 seconds • Fast insights</p>
                      <p className="text-xs text-gray-500">Get rapid AI analysis of your symptoms</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Deep Dive */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: type === 'general' ? 0.3 : 0.2 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleOptionClick('deep')}
                className="cursor-pointer group"
              >
                <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.1] transition-all">
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
                      Premium
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-600/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-600/30 group-hover:to-purple-600/30 transition-all">
                      <Brain className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Deep Dive</h3>
                      <p className="text-gray-400 text-sm mb-2">2-5 minutes • Comprehensive analysis</p>
                      <p className="text-xs text-gray-500">Advanced AI reasoning with follow-up questions</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}