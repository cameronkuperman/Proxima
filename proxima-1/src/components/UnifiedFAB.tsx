'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MessageSquare, FileText, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTutorial } from '@/contexts/TutorialContext';
import HelpMenu from './HelpMenu';

interface FABOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

export default function UnifiedFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { showWelcome } = useTutorial();

  const options: FABOption[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openOracleChat'));
        setIsOpen(false);
      },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'report',
      label: 'Generate Report',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openQuickReportChat'));
        setIsOpen(false);
      },
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'help',
      label: 'Help & Tutorials',
      icon: <HelpCircle className="w-5 h-5" />,
      onClick: () => {
        setShowHelpMenu(true);
        setIsOpen(false);
      },
      color: 'from-gray-600 to-gray-700'
    }
  ];

  return (
    <>
      {/* Main FAB - using inline style for precise positioning */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-800 border border-white/20' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600'
        }`}
        style={{ right: '32px' }}
        data-tour="floating-menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Expanded Options */}
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

            {/* Options Container - aligned with main button */}
            <div 
              className="fixed bottom-24 z-45 flex flex-col items-end space-y-3"
              style={{ right: '32px' }}
            >
              {options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 30, scale: 0.6 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { 
                      delay: index * 0.08,
                      duration: 0.4,
                      ease: [0.34, 1.56, 0.64, 1] // Spring easing
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.6,
                    transition: { 
                      delay: (options.length - index - 1) * 0.05,
                      duration: 0.3
                    }
                  }}
                  className="flex items-center gap-3"
                >
                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: {
                        delay: index * 0.08 + 0.1,
                        duration: 0.3
                      }
                    }}
                    className="px-3 py-1.5 bg-black/90 backdrop-blur-xl rounded-lg text-sm text-white whitespace-nowrap border border-white/10"
                  >
                    {option.label}
                  </motion.span>

                  {/* Button - same size as main FAB */}
                  <motion.button
                    ref={option.id === 'help' ? helpButtonRef : undefined}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      option.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-14 h-14 rounded-full bg-gradient-to-r ${option.color} shadow-lg flex items-center justify-center`}
                  >
                    <div className="text-white">
                      {option.icon}
                    </div>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Help Menu */}
      <HelpMenu 
        isOpen={showHelpMenu} 
        onClose={() => setShowHelpMenu(false)}
        anchorPosition={helpButtonRef.current ? {
          x: helpButtonRef.current.getBoundingClientRect().left,
          y: helpButtonRef.current.getBoundingClientRect().top
        } : undefined}
      />
    </>
  );
}