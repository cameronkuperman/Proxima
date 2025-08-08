'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, FileText, Navigation, CheckCircle } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialWelcomeProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: (feature: 'quickScan' | 'reports' | 'navigation') => void;
}

export default function TutorialWelcome({ isOpen, onClose, onStartTour }: TutorialWelcomeProps) {
  const { completedTours } = useTutorial();
  
  // Disable scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position and styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  const features = [
    {
      id: 'quickScan',
      title: 'Quick Scan',
      description: 'Get instant AI-powered health insights',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-emerald-600/20 to-green-600/20',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'reports',
      title: 'Health Reports',
      description: 'Generate and understand medical reports',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-blue-600/20 to-cyan-600/20',
      iconColor: 'text-blue-400'
    },
    {
      id: 'navigation',
      title: 'Navigate Seimeo',
      description: 'Find your way around the platform',
      icon: <Navigation className="w-6 h-6" />,
      color: 'from-purple-600/20 to-pink-600/20',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl mx-4"
          >

            {/* Main content */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/[0.05] rounded-xl p-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl font-bold text-white mb-4">
                  Welcome to Seimeo
                </h1>
                <p className="text-xl text-gray-400">
                  Your AI-powered health intelligence platform
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => onStartTour(feature.id as any)}
                  >
                    <div className={`p-6 rounded-xl backdrop-blur-[20px] bg-white/[0.03] border transition-all ${
                      completedTours.includes(feature.id) 
                        ? 'border-green-500/30 bg-green-500/[0.02]' 
                        : 'border-white/[0.05] hover:border-white/[0.1]'
                    }`}>
                      <div className={`w-14 h-14 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <div className={feature.iconColor}>
                          {feature.icon}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {feature.title}
                        </h3>
                        {completedTours.includes(feature.id) && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        {feature.description}
                      </p>
                      <button className={`text-sm transition-colors flex items-center gap-1 ${
                        completedTours.includes(feature.id)
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-white/60 hover:text-white'
                      }`}>
                        {completedTours.includes(feature.id) ? 'Review tutorial' : 'Show me how'} →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 space-y-4"
              >
                <div className="text-center">
                  <button
                    onClick={onClose}
                    className="px-8 py-3 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl text-gray-400 hover:text-white hover:border-white/[0.1] transition-all font-medium"
                  >
                    {completedTours.filter((tour, index, self) => self.indexOf(tour) === index).length >= 3 ? 'Continue to Dashboard' : 'Skip to Dashboard'}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500">
                  You can access tutorials anytime from the <span className="text-purple-400">+</span> button
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}