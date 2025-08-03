'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Mail, X, Wifi, Server, FileX, Clock } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    type: 'upload' | 'analysis' | 'network' | 'server' | 'file_size' | 'timeout';
    message: string;
    details?: string;
  };
  onRetry?: () => void;
}

export default function ErrorModal({ isOpen, onClose, error, onRetry }: ErrorModalProps) {
  if (!isOpen) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <Wifi className="w-6 h-6" />;
      case 'server':
        return <Server className="w-6 h-6" />;
      case 'file_size':
        return <FileX className="w-6 h-6" />;
      case 'timeout':
        return <Clock className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'network':
        return 'from-blue-500/20 to-cyan-500/20';
      case 'file_size':
        return 'from-yellow-500/20 to-orange-500/20';
      default:
        return 'from-red-500/20 to-pink-500/20';
    }
  };

  const getSuggestions = () => {
    switch (error.type) {
      case 'upload':
        return [
          'Check your internet connection',
          'Ensure photos are under 10MB each',
          'Try uploading fewer photos at once',
          'Check if the file format is supported (JPEG, PNG, HEIC)'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if you\'re using one',
          'Wait a moment and try again'
        ];
      case 'server':
        return [
          'Our servers might be experiencing high load',
          'Wait a few minutes and try again',
          'If the problem persists, contact support'
        ];
      case 'file_size':
        return [
          'Resize your photos to under 10MB',
          'Use JPEG format for smaller file sizes',
          'Consider using your phone\'s medium quality setting',
          'You can use online tools to compress images'
        ];
      case 'timeout':
        return [
          'The analysis is taking longer than expected',
          'Try with fewer photos',
          'Ensure you have a stable internet connection',
          'Close other tabs that might be using bandwidth'
        ];
      default:
        return [
          'Try again in a few moments',
          'Check your internet connection',
          'If the problem persists, contact support'
        ];
    }
  };

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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg backdrop-blur-[20px] bg-gray-900/90 border border-white/[0.1] rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getErrorColor()} p-6 border-b border-white/[0.05]`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  {getErrorIcon()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {error.type === 'file_size' ? 'File Too Large' : 'Something went wrong'}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">{error.message}</p>
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
            {error.details && (
              <div className="mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <p className="text-sm text-gray-400">{error.details}</p>
              </div>
            )}

            {/* Suggestions */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-white mb-3">What you can try:</h4>
              <ul className="space-y-2">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {onRetry && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onRetry();
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </motion.button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg bg-white/[0.03] text-gray-400 hover:text-white border border-white/[0.05] hover:border-white/[0.1] transition-all"
              >
                Close
              </button>
            </div>

            {/* Support link */}
            {error.type === 'server' && (
              <div className="mt-4 text-center">
                <button className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mx-auto">
                  <Mail className="w-3 h-3" />
                  Contact Support
                </button>
              </div>
            )}
          </div>

          {/* Error code for support */}
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-600">
              Error code: {error.type.toUpperCase()}_{Date.now()}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}