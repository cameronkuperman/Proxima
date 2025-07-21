'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { isComplete, isChecking } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for OAuth redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthRedirect = urlParams.get('oauth_redirect') === 'true';
    
    if (isOAuthRedirect) {
      console.log('OnboardingGuard: OAuth redirect detected, skipping redirect logic');
      return;
    }

    // Skip if still loading or checking
    if (authLoading || isChecking || isComplete === null) return;

    // No user, no guard needed
    if (!user) return;

    // Handle redirects based on onboarding status
    if (isComplete && pathname === '/onboarding') {
      console.log('OnboardingGuard: Already complete, redirecting to dashboard');
      router.push('/dashboard');
    } else if (!isComplete && pathname !== '/onboarding') {
      console.log('OnboardingGuard: Not complete, redirecting to onboarding');
      router.push('/onboarding');
    }
  }, [user, authLoading, isComplete, isChecking, pathname, router]);

  // Show loading while checking
  if (authLoading || isChecking || (user && isComplete === null)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // If no user, don't render children
  if (!user) {
    return null;
  }

  // Always render children on the onboarding page if user is logged in
  // This prevents race conditions where new users get redirected away
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  // For other pages, only render if onboarding is complete
  return isComplete ? <>{children}</> : null;
} 