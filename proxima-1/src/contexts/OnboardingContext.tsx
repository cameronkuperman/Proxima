'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, isOnboardingComplete } from '@/utils/onboarding';

interface OnboardingContextType {
  isComplete: boolean | null;
  isChecking: boolean;
  recheckOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkOnboarding = async () => {
    if (!user || isChecking) return;

    setIsChecking(true);
    console.log('OnboardingContext: Checking onboarding for user:', user.id);

    try {
      const userName = user.user_metadata?.name || 
                      user.user_metadata?.full_name || 
                      user.user_metadata?.preferred_name ||
                      null;

      const profile = await getUserProfile(user.id, user.email || '', userName);
      const complete = isOnboardingComplete(profile);
      
      console.log('OnboardingContext: Onboarding complete:', complete);
      setIsComplete(complete);
    } catch (error) {
      console.error('OnboardingContext: Error checking onboarding:', error);
      setIsComplete(false); // Assume incomplete on error
    } finally {
      setIsChecking(false);
    }
  };

  // Check onboarding when user changes
  useEffect(() => {
    if (user && !authLoading && isComplete === null) {
      checkOnboarding();
    } else if (!user && !authLoading) {
      setIsComplete(null);
      setIsChecking(false);
    }
  }, [user?.id, authLoading]); // Remove isComplete from dependencies

  const recheckOnboarding = async () => {
    setIsComplete(null); // Reset to trigger a new check
    await checkOnboarding();
  };

  return (
    <OnboardingContext.Provider value={{ isComplete, isChecking, recheckOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 