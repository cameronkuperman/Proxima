'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, BookOpen, Video, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { useRouter } from 'next/navigation';

interface HelpMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

export default function HelpMenu({ isOpen, onClose, anchorPosition }: HelpMenuProps) {
  const { showWelcome } = useTutorial();
  const router = useRouter();

  const menuItems = [
    {
      id: 'welcome',
      label: 'Basic Tutorial',
      description: 'Start with the basics',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'from-indigo-600/20 to-purple-600/20',
      iconColor: 'text-indigo-400',
      onClick: () => {
        showWelcome();
        onClose();
      }
    },
    {
      id: 'tutorials',
      label: 'Interactive Tutorials',
      description: 'Step-by-step guided tours',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'from-purple-600/20 to-pink-600/20',
      iconColor: 'text-purple-400',
      onClick: () => {
        showWelcome();
        onClose();
      }
    },
    {
      id: 'video',
      label: 'Video Guides',
      description: 'Watch quick demos',
      icon: <Video className="w-4 h-4" />,
      color: 'from-blue-600/20 to-cyan-600/20',
      iconColor: 'text-blue-400',
      onClick: () => {
        // Placeholder for video guides
        alert('Video guides coming soon!');
        onClose();
      }
    },
    {
      id: 'support',
      label: 'Contact Support',
      description: 'Get help from our team',
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'from-green-600/20 to-emerald-600/20',
      iconColor: 'text-green-400',
      onClick: () => {
        router.push('/support');
        onClose();
      }
    },
    {
      id: 'refresh',
      label: 'Refresh Progress',
      description: 'Update your health data',
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'from-amber-600/20 to-yellow-600/20',
      iconColor: 'text-amber-400',
      onClick: () => {
        window.location.reload();
        onClose();
      }
    }
  ];

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
            className="fixed inset-0 z-[60]"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[61] bg-gray-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden"
            style={{
              bottom: '160px',
              right: '90px', // Offset more to the left to avoid being cut off
              width: '280px'
            }}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-semibold text-white">Help & Resources</h3>
              </div>

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.onClick}
                    className="w-full text-left p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-lg transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 bg-gradient-to-r ${item.color} rounded-lg`}>
                        <div className={item.iconColor}>
                          {item.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white group-hover:text-gray-100">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}