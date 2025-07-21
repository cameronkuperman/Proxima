'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Zap, FileText, Navigation, CheckCircle, RefreshCw } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { tutorialService } from '@/services/tutorialService';

export default function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { startTour, completedTours, showWelcome } = useTutorial();
  const [isResetting, setIsResetting] = useState(false);

  const tutorials = [
    {
      id: 'quickScan',
      title: 'Quick Scan Tutorial',
      description: 'Learn how to use Quick Scan for instant health insights',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-emerald-600/20 to-green-600/20',
      iconColor: 'text-emerald-400'
    },
    {
      id: 'reports',
      title: 'Health Reports Guide',
      description: 'Understand how to generate and read your health reports',
      icon: <FileText className="w-5 h-5" />,
      color: 'from-blue-600/20 to-cyan-600/20',
      iconColor: 'text-blue-400'
    },
    {
      id: 'navigation',
      title: 'Platform Navigation',
      description: 'Discover all the features and how to navigate Proxima',
      icon: <Navigation className="w-5 h-5" />,
      color: 'from-purple-600/20 to-pink-600/20',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <>
      {/* Help Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-8 z-30 w-12 h-12 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 transition-all"
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* Help Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed bottom-40 right-8 z-40 w-80 bg-gray-900/95 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Help & Tutorials</h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    showWelcome();
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Show Welcome
                </button>
              </div>

              <div className="space-y-2">
                {tutorials.map((tutorial) => {
                  const isCompleted = completedTours.includes(tutorial.id);
                  
                  return (
                    <button
                      key={tutorial.id}
                      onClick={() => {
                        startTour(tutorial.id as any);
                        setIsOpen(false);
                      }}
                      className="w-full p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tutorial.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <div className={tutorial.iconColor}>
                            {tutorial.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-white">
                              {tutorial.title}
                            </h4>
                            {isCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {tutorial.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{Math.min(completedTours.filter((tour, index, self) => self.indexOf(tour) === index).length, 3)}/3 completed</span>
                </div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.min(completedTours.filter((tour, index, self) => self.indexOf(tour) === index).length, 3) / 3) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* Development only - Reset button */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={async () => {
                      if (user?.id && confirm('Reset all tutorial progress? (Dev only)')) {
                        setIsResetting(true);
                        await tutorialService.resetTutorialProgress(user.id);
                        window.location.reload();
                      }
                    }}
                    disabled={isResetting}
                    className="w-full py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {isResetting ? 'Resetting...' : 'Reset Tutorial Progress (Dev)'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}