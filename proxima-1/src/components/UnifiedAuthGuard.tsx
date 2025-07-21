'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface UnifiedAuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowIncompleteOnboarding?: boolean;
}

export default function UnifiedAuthGuard({ 
  children, 
  requireAuth = false,
  allowIncompleteOnboarding = false 
}: UnifiedAuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { isComplete, isChecking } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Reset render state
    setShouldRender(false);

    // Still loading - don't render yet
    if (authLoading || isChecking || (user && isComplete === null)) {
      return;
    }

    // Public pages that don't require auth
    if (!requireAuth) {
      // Special case: login page should redirect authenticated users
      if (pathname === '/login' && user) {
        if (isComplete) {
          console.log('UnifiedAuthGuard: Authenticated user on login page, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('UnifiedAuthGuard: Authenticated user on login page, redirecting to onboarding');
          router.push('/onboarding');
        }
        return;
      }
      
      // If user is logged in but hasn't completed onboarding, redirect
      if (user && !isComplete && !allowIncompleteOnboarding && pathname !== '/onboarding') {
        console.log('UnifiedAuthGuard: Authenticated user needs onboarding');
        router.push('/onboarding');
        return;
      }
      setShouldRender(true);
      return;
    }

    // Protected pages that require auth
    if (requireAuth) {
      // No user - redirect to login
      if (!user) {
        console.log('UnifiedAuthGuard: Auth required, redirecting to login');
        router.push('/login');
        return;
      }

      // User exists but onboarding incomplete
      if (!isComplete && !allowIncompleteOnboarding) {
        console.log('UnifiedAuthGuard: Protected page requires completed onboarding');
        router.push('/onboarding');
        return;
      }

      setShouldRender(true);
    }
  }, [user, authLoading, isComplete, isChecking, requireAuth, allowIncompleteOnboarding, pathname, router]);

  // Show loading while checking
  if (authLoading || isChecking || (user && isComplete === null) || !shouldRender) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 