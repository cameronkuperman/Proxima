'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Database, Clock, X, Info } from 'lucide-react';

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyInfoModal({ isOpen, onClose }: PrivacyInfoModalProps) {
  if (!isOpen) return null;

  const categories = [
    {
      name: 'Normal Medical',
      icon: <Eye className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      description: 'Standard medical conditions safe for tracking',
      examples: [
        'Skin rashes, acne, eczema',
        'Cuts, bruises, burns',
        'Visible infections (non-intimate)',
        'Post-surgical healing',
        'Any condition NOT in private areas'
      ],
      storage: 'Stored permanently for progress tracking'
    },
    {
      name: 'Sensitive Medical',
      icon: <EyeOff className="w-5 h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      description: 'Medical conditions in intimate areas',
      examples: [
        'Genital conditions',
        'Anal/perineal conditions',
        'Breast conditions',
        'Any intimate area concerns'
      ],
      storage: 'You choose: temporary analysis or full storage with privacy indicator'
    },
    {
      name: 'Medical Gore',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      description: 'Severe but legitimate medical content',
      examples: [
        'Deep wounds',
        'Active surgical procedures',
        'Severe trauma',
        'Major burns'
      ],
      storage: 'Stored with appropriate warnings'
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
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-[20px] bg-gray-900/90 border border-white/[0.1] rounded-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 border-b border-white/[0.05] backdrop-blur-[20px] z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Privacy & Photo Categories</h3>
                  <p className="text-sm text-gray-400">How we protect your medical photos</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Security Features */}
            <div className="mb-8 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Your Privacy is Protected
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">End-to-End Encryption</p>
                    <p className="text-xs text-gray-400">All photos encrypted at rest and in transit</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Enterprise Security</p>
                    <p className="text-xs text-gray-400">Medical-grade security standards</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Auto-Deletion Options</p>
                    <p className="text-xs text-gray-400">Sensitive photos can expire after 24h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Categories */}
            <h4 className="text-lg font-semibold text-white mb-4">Photo Categories Explained</h4>
            <div className="space-y-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <span className={category.color}>{category.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-base font-semibold text-white mb-1">{category.name}</h5>
                      <p className="text-sm text-gray-400 mb-3">{category.description}</p>
                      
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-300 mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {category.examples.map((example, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                              <span className="text-gray-600 mt-0.5">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 rounded bg-white/[0.02]">
                        <Info className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-400">{category.storage}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Data Retention */}
            <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-base font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Data Retention Policy
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span><strong>Normal photos:</strong> Stored until you delete them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span><strong>Sensitive (temporary):</strong> Auto-deleted after 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span><strong>Analysis results:</strong> Always preserved, even if photos are deleted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span><strong>Your right:</strong> Request complete data deletion anytime</span>
                </li>
              </ul>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Zero-Knowledge Architecture</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Database className="w-4 h-4" />
                <span>ISO 27001 Compliant</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}