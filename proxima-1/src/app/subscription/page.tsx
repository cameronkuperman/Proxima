'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, HelpCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import CurrentPlanCard from '@/components/subscription/CurrentPlanCard';
import UsageCard from '@/components/subscription/UsageCard';
import BillingHistoryCard from '@/components/subscription/BillingHistoryCard';
import CancellationModal from '@/components/subscription/CancellationModal';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';

export default function SubscriptionManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  useEffect(() => {
    // Always sync with Stripe when visiting the page
    handleForceSync();
    
    // Clean up URL if returning from portal
    if (searchParams.get('updated') === 'true') {
      router.replace('/subscription');
    }
  }, []);
  
  const fetchSubscriptionDetails = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?redirect=/subscription');
        return;
      }
      
      const response = await fetch('/api/stripe/get-subscription-details', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription details');
      }
      
      setSubscriptionData(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForceSync = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?redirect=/subscription');
        return;
      }
      
      // Force sync with Stripe to ensure latest data
      const syncResponse = await fetch('/api/stripe/force-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const syncData = await syncResponse.json();
      
      // Always fetch subscription details after sync attempt
      await fetchSubscriptionDetails();
      
      // Only show success toast if actually coming from portal
      if (searchParams.get('updated') === 'true' && syncData.success) {
        toast.success('Subscription updated');
      }
    } catch (error: any) {
      console.error('Error syncing subscription:', error);
      // Fallback to just fetching current data
      await fetchSubscriptionDetails();
    }
  };
  
  const handleManageBilling = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to manage billing');
        return;
      }
      
      setProcessingAction(true);
      
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }
      
      // Open Stripe Customer Portal in same tab
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleCancelSubscription = async (reason: string, feedback: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to cancel subscription');
        return;
      }
      
      setProcessingAction(true);
      
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'cancel',
          reason,
          feedback,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      toast.success("Subscription canceled. You'll retain access until the end of your billing period.");
      setShowCancelModal(false);
      
      // Refresh subscription data
      await fetchSubscriptionDetails();
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleResumeSubscription = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to resume subscription');
        return;
      }
      
      setProcessingAction(true);
      
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'resume',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume subscription');
      }
      
      toast.success('Subscription resumed successfully!');
      
      // Refresh subscription data
      await fetchSubscriptionDetails();
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
    } finally {
      setProcessingAction(false);
    }
  };
  
  if (loading) {
    return (
      <UnifiedAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-purple-600/20 border-t-purple-600 animate-spin" />
          </div>
        </div>
      </UnifiedAuthGuard>
    );
  }
  
  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10" />
        
        {/* Header */}
        <div className="relative border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
                  <p className="text-sm text-gray-400">Manage your plan and billing</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.href = '/pricing'}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 font-medium rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all"
                >
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Compare Plans
                </button>
                
                <button
                  onClick={() => window.location.href = '/support'}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-all"
                  title="Get help"
                >
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column - Current Plan */}
            <div className="lg:col-span-1">
              <CurrentPlanCard
                subscription={subscriptionData?.subscription}
                tier={subscriptionData?.tier || 'free'}
                status={subscriptionData?.status || 'no_subscription'}
                upcomingInvoice={subscriptionData?.upcoming_invoice}
                onManageBilling={handleManageBilling}
                onCancelPlan={() => setShowCancelModal(true)}
                onResumePlan={handleResumeSubscription}
              />
            </div>
            
            {/* Middle column - Usage */}
            <div className="lg:col-span-1">
              <UsageCard
                features={subscriptionData?.features || {}}
                usage={subscriptionData?.usage || {}}
                tier={subscriptionData?.tier || 'free'}
              />
            </div>
            
            {/* Right column - Billing History */}
            <div className="lg:col-span-1">
              <BillingHistoryCard
                invoices={subscriptionData?.invoices || []}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          {subscriptionData?.tier !== 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-6 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={handleManageBilling}
                  disabled={processingAction}
                  className="p-4 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-all text-left group"
                >
                  <h4 className="font-medium text-white mb-1">Update Payment Method</h4>
                  <p className="text-sm text-gray-400">Change your card or billing details</p>
                </button>
                
                <button
                  onClick={handleManageBilling}
                  disabled={processingAction}
                  className="p-4 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-all text-left group"
                >
                  <h4 className="font-medium text-white mb-1">Download Invoices</h4>
                  <p className="text-sm text-gray-400">Get PDF copies for your records</p>
                </button>
                
                {subscriptionData?.tier !== 'pro_plus' && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 rounded-lg transition-all text-left group border border-purple-600/20"
                  >
                    <h4 className="font-medium text-white mb-1">Upgrade Plan</h4>
                    <p className="text-sm text-gray-400">Get more features and limits</p>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Cancellation Modal */}
        <CancellationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelSubscription}
          currentTier={subscriptionData?.tier || 'basic'}
          periodEnd={subscriptionData?.subscription?.current_period_end || ''}
        />
      </div>
    </UnifiedAuthGuard>
  );
}