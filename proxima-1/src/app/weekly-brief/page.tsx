'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeeklyHealthBrief from '@/components/WeeklyHealthBrief';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import { ArrowLeft } from 'lucide-react';

export default function WeeklyBriefPage() {
  const router = useRouter();
  const [briefOpen, setBriefOpen] = useState(false);
  
  useEffect(() => {
    // Auto-open the brief when the page loads
    setBriefOpen(true);
  }, []);
  
  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Weekly Health Brief</h1>
          <p className="text-gray-400 mb-8">Your personalized health insights for the week</p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 hover:text-white rounded-lg transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            
            <button
              onClick={() => setBriefOpen(true)}
              className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all"
            >
              View Weekly Brief
            </button>
          </div>
        </div>
        
        <WeeklyHealthBrief 
          isOpen={briefOpen} 
          onClose={() => {
            setBriefOpen(false);
            // Optionally redirect after closing
            setTimeout(() => router.push('/dashboard'), 300);
          }} 
        />
      </div>
    </UnifiedAuthGuard>
  );
}