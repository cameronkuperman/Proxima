'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ChevronDown } from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, feedback: string) => void;
  currentTier: string;
  periodEnd: string;
}

export default function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  currentTier,
  periodEnd,
}: CancellationModalProps) {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  
  const reasons = [
    'Too expensive',
    'Not using it enough',
    'Missing features I need',
    'Found a better alternative',
    'Technical issues',
    'Other',
  ];
  
  const featuresLosing = {
    pro_plus: [
      'Unlimited AI consultations',
      'Advanced health analytics',
      'Priority support',
      'Team accounts',
      '100GB storage',
    ],
    pro: [
      'Unlimited oracle chats',
      'Deep dive assessments',
      'Photo analysis tracking',
      'Professional reports',
      '25GB storage',
    ],
    basic: [
      'Extended consultations',
      'Quick scan assessments',
      'Basic reports',
      '5GB storage',
    ],
  };
  
  const handleConfirm = () => {
    onConfirm(reason || 'not_specified', feedback);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="backdrop-blur-[20px] bg-black/90 border border-white/[0.1] rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Cancel Subscription</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Warning */}
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium mb-1">
                      You'll lose access to premium features
                    </p>
                    <p className="text-sm text-gray-300">
                      Your subscription will remain active until {new Date(periodEnd).toLocaleDateString()}.
                      After that, you'll be downgraded to the free plan.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Features losing */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-3">You'll lose access to:</p>
                <ul className="space-y-2">
                  {(featuresLosing[currentTier as keyof typeof featuresLosing] || featuresLosing.basic).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <span className="text-red-400">×</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Reason selection */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  Why are you canceling? (optional)
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowReasonDropdown(!showReasonDropdown)}
                    className="w-full p-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-left text-white flex items-center justify-between hover:bg-white/[0.08] transition-all"
                  >
                    <span className={reason ? 'text-white' : 'text-gray-500'}>
                      {reason || 'Select a reason'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showReasonDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showReasonDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/[0.1] rounded-lg overflow-hidden z-10"
                      >
                        {reasons.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setReason(r);
                              setShowReasonDropdown(false);
                            }}
                            className="w-full p-3 text-left text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all"
                          >
                            {r}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Feedback */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">
                  Any feedback? (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us how we can improve..."
                  className="w-full p-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 resize-none h-20 focus:outline-none focus:border-white/[0.2] transition-all"
                />
              </div>
              
              {/* Alternative offer */}
              {currentTier !== 'basic' && (
                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-purple-400 font-medium mb-1">
                    Consider downgrading instead?
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    Keep some premium features with a lower-tier plan
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = '/pricing';
                    }}
                    className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all text-sm font-medium"
                  >
                    View Other Plans
                  </button>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium rounded-lg transition-all"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-all"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}