'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface TutorialTourProps {
  isActive: boolean;
  onComplete: () => void;
  steps: TourStep[];
  tourName: string;
}

export default function TutorialTour({ isActive, onComplete, steps, tourName }: TutorialTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  // Disable scroll when tour is active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  // Keep first element highlighted throughout the tour (except for navigation tour)
  useEffect(() => {
    if (!isActive || !steps[0] || tourName === 'navigation') return;
    
    const firstTarget = document.querySelector(steps[0].target);
    if (firstTarget) {
      firstTarget.classList.add('tutorial-highlight');
    }
    
    return () => {
      if (firstTarget) {
        firstTarget.classList.remove('tutorial-highlight');
      }
    };
  }, [isActive, steps, tourName]);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].target);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const padding = 20;

      let top = 0;
      let left = 0;
      let preferredPlacement = steps[currentStep].placement || 'bottom';

      // Calculate position based on placement
      switch (preferredPlacement) {
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'top':
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          break;
      }

      // Keep tooltip within viewport with extra padding at bottom
      const bottomPadding = 40; // Extra padding for bottom edge
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - bottomPadding));

      setTooltipPosition({ top, left });
      setPlacement(preferredPlacement);

      // Add highlight to current target element
      // For navigation tour, always highlight current element
      // For other tours, only highlight if not the first element
      if (tourName === 'navigation' || currentStep !== 0) {
        target.classList.add('tutorial-highlight');
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      // Remove highlight from current element
      // For navigation tour, always remove
      // For other tours, only remove if not the first element
      if (tourName === 'navigation' || currentStep !== 0) {
        const target = document.querySelector(steps[currentStep].target);
        if (target) {
          target.classList.remove('tutorial-highlight');
        }
      }
      
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, steps, isActive]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Execute any action for current step
      if (steps[currentStep].action) {
        steps[currentStep].action();
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Remove all highlights before completing
    steps.forEach((step, index) => {
      const target = document.querySelector(step.target);
      if (target) {
        target.classList.remove('tutorial-highlight');
      }
    });
    
    // Tour completion is now handled by TutorialContext which updates Supabase
    onComplete();
  };

  if (!isActive) return null;

  return (
    <>
      
      {/* Highlight target element */}
      <style jsx global>{`
        .tutorial-highlight {
          outline: 3px solid rgba(139, 92, 246, 0.8) !important;
          outline-offset: 4px !important;
        }
      `}</style>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[10000] w-80"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          <div className="bg-black/90 backdrop-blur-xl border border-white/[0.05] rounded-xl p-6 shadow-2xl">
            {/* Progress dots */}
            <div className="flex gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-white w-6'
                      : index < currentStep
                      ? 'bg-white/60'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-white mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {steps[currentStep].content}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-5 py-2.5 bg-white/[0.05] border border-white/[0.05] rounded-xl text-gray-400 hover:text-white hover:border-white/[0.1] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 text-sm flex items-center gap-1"
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}