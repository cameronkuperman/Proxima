'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import TutorialWelcome from '@/components/tutorial/TutorialWelcome';
import TutorialTour from '@/components/tutorial/TutorialTour';
import { tutorialService } from '@/services/tutorialService';
import { useAuth } from '@/contexts/AuthContext';

interface TutorialContextValue {
  startTour: (tourName: 'quickScan' | 'reports' | 'navigation') => void;
  showWelcome: () => void;
  isAnyTourActive: boolean;
  completedTours: string[];
  initializeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}

const tours = {
  quickScan: [
    {
      target: '[data-tour="quick-scan-card"]',
      title: 'Quick Scan',
      content: 'This is your fastest way to get health insights. Click here to start a quick AI-powered analysis.',
      placement: 'bottom' as const
    },
    {
      target: '[data-tour="body-map"]',
      title: 'Select Your Symptoms',
      content: 'Click on the area of your body where you\'re experiencing symptoms. The 3D model makes it easy to be precise.',
      placement: 'right' as const
    },
    {
      target: '[data-tour="symptom-form"]',
      title: 'Describe Your Symptoms',
      content: 'Fill out a quick form about your symptoms. The AI will analyze this information instantly.',
      placement: 'left' as const
    },
    {
      target: '[data-tour="results"]',
      title: 'Get Instant Results',
      content: 'Receive AI-powered insights, potential causes, and recommendations within seconds.',
      placement: 'top' as const
    }
  ],
  reports: [
    {
      target: '[data-tour="reports-card"]',
      title: 'Health Reports',
      content: 'Access all your health reports in one place. Click here to view your report history.',
      placement: 'bottom' as const
    },
    {
      target: '[data-tour="generate-report"]',
      title: 'Generate New Report',
      content: 'Create professional medical reports from your chat history and health data.',
      placement: 'top' as const
    },
    {
      target: '[data-tour="report-filters"]',
      title: 'Filter and Search',
      content: 'Easily find specific reports by date, type, or symptoms.',
      placement: 'bottom' as const
    }
  ],
  navigation: [
    {
      target: '[data-tour="timeline-sidebar"]',
      title: 'Your Health Timeline',
      content: 'This sidebar shows all your past interactions. Hover to expand and see your health history.',
      placement: 'right' as const
    },
    {
      target: '[data-tour="floating-menu"]',
      title: 'Quick Actions',
      content: 'Use this floating button to quickly start a new chat or generate a report from anywhere.',
      placement: 'left' as const
    },
    {
      target: '[data-tour="profile-card"]',
      title: 'Your Profile',
      content: 'Keep your health profile updated for more accurate AI insights. Click to add allergies, medications, and more.',
      placement: 'bottom' as const
    }
  ]
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeTour, setActiveTour] = useState<'quickScan' | 'reports' | 'navigation' | null>(null);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize function to be called from dashboard
  const initializeTutorial = async () => {
    if (isInitialized || !user?.id) return; // Prevent multiple initializations
    
    setIsLoading(true);
    try {
      // Fetch user's tutorial progress from Supabase
      const tutorialData = await tutorialService.getUserTutorialProgress(user.id);
      
      if (tutorialData) {
        setCompletedTours(tutorialData.completed_tours || []);
        
        if (!tutorialData.has_seen_welcome) {
          // Small delay to ensure dashboard is loaded
          setTimeout(() => setShowWelcomeModal(true), 1000);
        }
      }
    } catch (error) {
      console.error('Error initializing tutorial:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const startTour = (tourName: 'quickScan' | 'reports' | 'navigation') => {
    setShowWelcomeModal(false);
    setActiveTour(tourName);
  };

  const showWelcome = () => {
    setShowWelcomeModal(true);
  };

  const handleWelcomeClose = async () => {
    setShowWelcomeModal(false);
    // Update in Supabase
    if (user?.id) {
      await tutorialService.updateHasSeenWelcome(user.id);
    }
  };

  const handleTourComplete = async () => {
    if (activeTour && user?.id) {
      // Update local state
      const updated = [...completedTours, activeTour];
      setCompletedTours(updated);
      
      // Update in Supabase
      await tutorialService.addCompletedTour(user.id, activeTour);
    }
    setActiveTour(null);
    
    // Show the welcome modal again so users can select another tutorial
    setTimeout(() => setShowWelcomeModal(true), 300);
  };

  return (
    <TutorialContext.Provider
      value={{
        startTour,
        showWelcome,
        isAnyTourActive: activeTour !== null,
        completedTours,
        initializeTutorial
      }}
    >
      {children}
      
      <TutorialWelcome
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        onStartTour={startTour}
      />
      
      {activeTour && (
        <TutorialTour
          isActive={true}
          onComplete={handleTourComplete}
          steps={tours[activeTour]}
          tourName={activeTour}
        />
      )}
    </TutorialContext.Provider>
  );
}