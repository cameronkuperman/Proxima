'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sun, Focus, Ruler, RotateCw } from 'lucide-react';

interface PhotoQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
}

export default function PhotoQualityModal({
  isOpen,
  onClose,
  onRetake
}: PhotoQualityModalProps) {
  if (!isOpen) return null;

  const tips = [
    {
      icon: Sun,
      title: 'Use Better Lighting',
      description: 'Natural daylight works best. Avoid shadows and harsh lighting.',
      color: 'text-yellow-400'
    },
    {
      icon: Focus,
      title: 'Focus on the Area',
      description: 'Make sure the affected area is in sharp focus and clearly visible.',
      color: 'text-blue-400'
    },
    {
      icon: Ruler,
      title: 'Include Size Reference',
      description: 'Place a coin, ruler, or common object next to the area for scale.',
      color: 'text-green-400'
    },
    {
      icon: Camera,
      title: 'Hold Camera Steady',
      description: 'Keep your device still and tap to focus before taking the photo.',
      color: 'text-purple-400'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg backdrop-blur-[20px] bg-gray-900/90 border border-white/[0.1] rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Photo Quality Issue</h3>
                <p className="text-sm text-gray-400">We couldn't clearly see the medical concern</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 mb-6">
              For accurate analysis, we need clearer photos. Here are some tips for better results:
            </p>

            {/* Tips Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {tips.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  <tip.icon className={`w-6 h-6 ${tip.color} mb-2`} />
                  <h4 className="text-sm font-medium text-white mb-1">{tip.title}</h4>
                  <p className="text-xs text-gray-400">{tip.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-blue-400 font-medium">Pro Tip</p>
                  <p className="text-xs text-gray-300">
                    Take multiple photos from different angles. You can upload up to 5 photos.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetake}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Retake Photos
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all"
              >
                Try Anyway
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}