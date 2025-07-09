'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, isOnboardingComplete } from '@/utils/onboarding';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user || loading) {
        setChecking(false);
        return;
      }

      if (!user.email) {
        console.error('OnboardingGuard: User email not found');
        router.push('/onboarding');
        return;
      }

      console.log('OnboardingGuard: Checking onboarding status for user:', user.id);
      
      try {
        // Get user's name from metadata or user_metadata
        const userName = user.user_metadata?.name || 
                        user.user_metadata?.full_name || 
                        user.user_metadata?.preferred_name ||
                        null;

        const profile = await getUserProfile(user.id, user.email, userName);
        const complete = isOnboardingComplete(profile);
        
        console.log('OnboardingGuard: Profile:', profile);
        console.log('OnboardingGuard: Onboarding complete:', complete);
        
        if (!complete) {
          console.log('OnboardingGuard: Redirecting to onboarding');
          router.push('/onboarding');
          return;
        }
        
        setOnboardingComplete(true);
      } catch (error) {
        console.error('OnboardingGuard: Error checking onboarding:', error);
        // On error, redirect to onboarding to be safe
        router.push('/onboarding');
        return;
      } finally {
        setChecking(false);
      }
    }

    checkOnboardingStatus();
  }, [user, loading, router]);

  // Show loading while checking auth or onboarding status
  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated and onboarding is complete
  if (!user) {
    return null;
  }

  if (!onboardingComplete) {
    return null;
  }

  return <>{children}</>;
} 