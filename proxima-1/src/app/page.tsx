'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import PhotoAnalysis from "@/components/PhotoAnalysis";
import AIPartners from "@/components/AIPartners";
import HealthcarePros from "@/components/HealthcarePros";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if this is an OAuth redirect
    const checkOAuthRedirect = async () => {
      // Check for error in URL
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.log('OAuth error in URL:', error, errorDescription);
        router.push(`/login?error=${encodeURIComponent(errorDescription || error)}`);
        return;
      }
      
      // Check if this is from OAuth callback
      const isOAuthCallback = searchParams.get('oauth_callback') === 'true';
      
      if (isOAuthCallback || window.location.hash) {
        console.log('OAuth callback detected, waiting for session...');
        
        // Give Supabase time to process the auth
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Session established!', session.user.email);
            
            // Check if user needs onboarding
            const { data: profile } = await supabase
              .from('medical')
              .select('age, height, weight, personal_health_context')
              .eq('id', session.user.id)
              .single();
              
            const needsOnboarding = !profile || !profile.age || !profile.height || !profile.weight || !profile.personal_health_context;
            
            // Clean up URL
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('oauth_callback');
            window.history.replaceState({}, '', cleanUrl.toString());
            
            if (needsOnboarding) {
              console.log('Redirecting to onboarding...');
              router.push('/onboarding');
            } else {
              console.log('Redirecting to dashboard...');
              router.push('/dashboard');
            }
            return;
          }
          
          attempts++;
        }
        
        // If we get here, no session was established
        console.error('No session established after OAuth');
        router.push('/login?error=Authentication failed - please try again');
        return;
      }
      
      // Check if we have an existing session - but don't redirect
      // Allow authenticated users to view the landing page
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('User is authenticated but can stay on landing page');
        // Don't redirect - let them browse the landing page
      }
    };
    
    checkOAuthRedirect();
  }, [router, searchParams]);
  
  return (
    <UnifiedAuthGuard requireAuth={false}>
      <main className="min-h-screen flex flex-col items-stretch">
        <NavBar />
        <Hero />
        <HowItWorks />
        <Features />
        <PhotoAnalysis />
        <AIPartners />
        <HealthcarePros />
        <About />
        <Testimonials />
        <Contact />
      </main>
    </UnifiedAuthGuard>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
