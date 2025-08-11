'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'free' | 'premium';
  tokenUsage?: any;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  tokenUsage
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/pricing');
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="bg-[#0f0f0f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="relative p-8 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent opacity-50" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentTier === 'free' 
                      ? '🌟 Your Health Journey Continues'
                      : '🚀 Unlock Premium+ Features'}
                  </h2>
                  <p className="text-gray-300">
                    {currentTier === 'free'
                      ? 'Your conversation is rich with important health information!'
                      : 'Experience the ultimate in AI-powered health insights'}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Current Status */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6">
                  <h3 className="text-white font-medium mb-3">Current Status:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300 text-sm">All your messages are saved and visible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300 text-sm">You can continue chatting with Oracle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-gray-300 text-sm">
                        {currentTier === 'free' 
                          ? 'Oracle can only remember your last 10 messages'
                          : 'Limited to 200k tokens with compression'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tier Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Free Tier */}
                  <div className={`border rounded-xl p-4 ${currentTier === 'free' ? 'border-white/[0.2] bg-white/[0.03]' : 'border-white/[0.08]'}`}>
                    <h4 className="text-white font-medium mb-3">Free</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 text-sm">100k token limit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 text-sm">❌ Stops at limit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 text-sm">Basic summaries</span>
                      </li>
                    </ul>
                  </div>

                  {/* Premium Tier */}
                  <div className={`border rounded-xl p-4 ${currentTier === 'premium' ? 'border-purple-500/[0.3] bg-purple-500/[0.05]' : 'border-white/[0.08]'}`}>
                    <h4 className="text-white font-medium mb-3">Premium</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 text-sm">200k token limit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 text-sm">✅ Intelligent compression</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 text-sm">Full medical context</span>
                      </li>
                    </ul>
                  </div>

                  {/* Premium+ Tier */}
                  <div className="border border-gradient-to-r from-purple-500/[0.3] to-pink-500/[0.3] bg-gradient-to-br from-purple-500/[0.05] to-pink-500/[0.05] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-white font-medium">Premium+</h4>
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">NEW</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-sm font-medium">1M token limit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 text-sm">✅ Never lose context</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 text-sm">Advanced AI models</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">
                    {currentTier === 'free' ? 'Upgrade to Premium for:' : 'Upgrade to Premium+ for:'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Full Conversation Memory</p>
                        <p className="text-gray-400 text-xs">Oracle remembers everything</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Complete Medical Context</p>
                        <p className="text-gray-400 text-xs">Every symptom and medication tracked</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Seamless Continuity</p>
                        <p className="text-gray-400 text-xs">Pick up exactly where you left off</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {currentTier === 'free' ? 'Unlimited Context' : 'Massive Context Window'}
                        </p>
                        <p className="text-gray-400 text-xs">Never lose important health details</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleUpgrade}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02]"
                  >
                    {currentTier === 'free' 
                      ? 'Upgrade Now - $9.99/month'
                      : 'Upgrade to Premium+ - $19.99/month'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white/[0.05] text-gray-400 rounded-xl hover:bg-white/[0.08] transition-colors"
                  >
                    Continue with {currentTier === 'free' ? 'Limited' : 'Current'} Context
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}