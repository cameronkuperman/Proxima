'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function OAuthRedirectPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function checkAndRedirect() {
      if (!user) {
        console.log('OAuth redirect: No user, waiting...');
        return;
      }

      console.log('OAuth redirect: Checking user onboarding status');
      
      try {
        const { data: profile } = await supabase
          .from('medical')
          .select('age, height, weight, personal_health_context')
          .eq('id', user.id)
          .single();

        const isComplete = profile && 
          profile.age && profile.age.trim() !== '' &&
          profile.height && profile.height.trim() !== '' &&
          profile.weight && profile.weight.trim() !== '' &&
          profile.personal_health_context && profile.personal_health_context.trim() !== '';

        if (!isComplete) {
          console.log('OAuth redirect: Onboarding incomplete, redirecting to /onboarding');
          router.push('/onboarding');
        } else {
          console.log('OAuth redirect: Onboarding complete, redirecting to /dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('OAuth redirect: Error checking profile:', error);
        router.push('/onboarding');
      }
    }

    checkAndRedirect();
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-sm">Setting up your account...</p>
      </div>
    </div>
  );
}