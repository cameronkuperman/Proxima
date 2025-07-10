'use client';

import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NarrativeView from '@/components/intelligence/NarrativeView';
import DataView from '@/components/intelligence/DataView';
import OnboardingGuard from '@/components/OnboardingGuard';

export default function IntelligencePage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'narrative' | 'data'>('narrative');

  return (
    <OnboardingGuard>
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">Health Intelligence</h1>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
              <button
                onClick={() => setActiveView('narrative')}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  activeView === 'narrative'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Narrative
              </button>
              <button
                onClick={() => setActiveView('data')}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  activeView === 'data'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Data View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full width */}
      <div className="px-6 py-8">
        <AnimatePresence mode="wait">
          {activeView === 'narrative' ? (
            <NarrativeView key="narrative" />
          ) : (
            <DataView key="data" />
          )}
        </AnimatePresence>
      </div>
    </div>
    </OnboardingGuard>
  );
}