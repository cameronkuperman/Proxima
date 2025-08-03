'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Clock, AlertCircle, Database } from 'lucide-react';

interface SensitiveContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecision: (decision: 'analyze_once' | 'analyze_24h' | 'store_normal' | 'cancel') => void;
}

export default function SensitiveContentModal({
  isOpen,
  onClose,
  onDecision
}: SensitiveContentModalProps) {
  if (!isOpen) return null;

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
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-6 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Privacy Notice</h3>
                <p className="text-sm text-gray-400">Sensitive medical content detected</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                This appears to be a photo of a sensitive medical area. We prioritize your privacy and offer different options for handling this content.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Your Privacy Matters</p>
                    <p className="text-xs text-gray-400">Sensitive photos require special handling to protect your privacy</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300 font-medium">Limited Tracking</p>
                    <p className="text-xs text-gray-400">Photos won't be stored, limiting long-term tracking capabilities</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onDecision('analyze_once')}
                className="w-full p-4 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-amber-500/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-1">Analyze Without Storing</h4>
                    <p className="text-sm text-gray-400">Get immediate analysis, photo deleted instantly</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onDecision('analyze_24h')}
                className="w-full p-4 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-blue-500/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-1">Store Temporarily & Delete After Analysis</h4>
                    <p className="text-sm text-gray-400">Photo stored for analysis, automatically deleted after 24 hours</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onDecision('store_normal')}
                className="w-full p-4 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-green-500/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium mb-1">Store Normally for Tracking</h4>
                    <p className="text-sm text-gray-400">Keep photo for long-term progress tracking (with privacy indicator)</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Database className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onDecision('cancel')}
                className="w-full p-3 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all"
              >
                Cancel Analysis
              </motion.button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center mt-4">
              All analyses are encrypted and HIPAA compliant
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}