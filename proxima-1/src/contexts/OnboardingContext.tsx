'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, isOnboardingComplete } from '@/utils/onboarding';

interface OnboardingContextType {
  isComplete: boolean | null;
  isChecking: boolean;
  recheckOnboarding: () => Promise<void>;
  markOnboardingComplete: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Cache to prevent redundant database calls
const onboardingCache = new Map<string, { isComplete: boolean; timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes (shorter duration)
const MAX_CACHE_SIZE = 1000; // Prevent memory leaks

// Clean up old cache entries
const cleanupCache = () => {
  const now = Date.now();
  const entries = Array.from(onboardingCache.entries());
  
  // Remove expired entries
  for (const [userId, data] of entries) {
    if (now - data.timestamp > CACHE_DURATION) {
      onboardingCache.delete(userId);
    }
  }
  
  // If still too large, remove oldest entries
  if (onboardingCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, onboardingCache.size - MAX_CACHE_SIZE);
    
    for (const [userId] of sortedEntries) {
      onboardingCache.delete(userId);
    }
  }
};

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkOnboarding = async (forceRefresh = false) => {
    if (!user || isChecking) return;

    // Cleanup old cache entries periodically
    cleanupCache();

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = onboardingCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('OnboardingContext: Using cached result:', cached.isComplete);
        setIsComplete(cached.isComplete);
        return;
      }
    }

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
      
      // Cache the result
      onboardingCache.set(user.id, {
        isComplete: complete,
        timestamp: Date.now()
      });
      
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
  }, [user?.id, authLoading]);

  const recheckOnboarding = async () => {
    setIsComplete(null); // Reset to trigger a new check
    await checkOnboarding(true); // Force refresh cache
  };

  const markOnboardingComplete = () => {
    if (user?.id) {
      // Update cache directly
      onboardingCache.set(user.id, {
        isComplete: true,
        timestamp: Date.now()
      });
      setIsComplete(true);
      console.log('OnboardingContext: Marked onboarding as complete without DB call');
    }
  };

  return (
    <OnboardingContext.Provider value={{ isComplete, isChecking, recheckOnboarding, markOnboardingComplete }}>
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