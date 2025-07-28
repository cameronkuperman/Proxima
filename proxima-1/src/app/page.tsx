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
      
      // Check if we have a session after OAuth redirect
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session and we're on the home page, redirect to dashboard
      if (session && !window.location.hash && !searchParams.toString()) {
        console.log('Found session on home page, likely OAuth redirect. Redirecting to dashboard...');
        router.push('/dashboard');
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
