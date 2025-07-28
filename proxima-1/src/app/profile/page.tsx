'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import AccountSettings from '@/components/profile/AccountSettings';
import HealthDataSummary from '@/components/profile/HealthDataSummary';
import HealthProfileModal from '@/components/HealthProfileModal';

export const dynamic = 'force-dynamic';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Function to trigger refresh of health data
  const handleProfileSave = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Get user display name and email - with safety checks
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  
  // Format member since date
  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Recently';
    
  // Safety check for avatar initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <UnifiedAuthGuard requireAuth={true}>
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
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
              <h1 className="text-xl font-semibold text-white">Account & Settings</h1>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Section */}
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-semibold text-white">
                {getInitials(displayName)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
                <p className="text-gray-400">{userEmail}</p>
                <p className="text-sm text-gray-500 mt-1">Member since {memberSince}</p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <SubscriptionCard />

          {/* Health Data Summary */}
          <HealthDataSummary 
            onConfigureClick={() => setProfileModalOpen(true)} 
            refreshTrigger={refreshTrigger}
          />

          {/* Account Settings */}
          <AccountSettings />
        </motion.div>
      </div>

      {/* Health Profile Modal */}
      <HealthProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        onSave={handleProfileSave}
      />
    </div>
    </UnifiedAuthGuard>
  );
}