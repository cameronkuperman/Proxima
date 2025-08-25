'use client';

import { motion } from 'framer-motion';
import { Crown, CreditCard, Calendar, AlertCircle, Settings } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SubscriptionCard() {
  const { subscription, hasActiveSubscription, tier, loading } = useSubscription();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const router = useRouter();

  const handleManageSubscription = async () => {
    // Navigate to the new subscription management page
    router.push('/subscription');
  };

  if (loading) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTierDisplay = (tierName: string) => {
    switch (tierName) {
      case 'basic':
        return { name: 'Basic', color: 'text-blue-400' };
      case 'pro':
        return { name: 'Pro', color: 'text-purple-400' };
      case 'pro_plus':
        return { name: 'Pro+', color: 'text-pink-400' };
      default:
        return { name: 'Free', color: 'text-gray-400' };
    }
  };

  const tierDisplay = getTierDisplay(tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-400" />
          Subscription
        </h3>
        <button
          onClick={handleManageSubscription}
          className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all text-sm font-medium flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Manage Plan
        </button>
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Current Plan</span>
          <span className={`font-medium ${tierDisplay.color}`}>
            {tierDisplay.name} {hasActiveSubscription && subscription?.status === 'trialing' && '(Trial)'}
          </span>
        </div>

        {hasActiveSubscription && subscription && (
          <>
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Status</span>
              <span className={`text-sm capitalize ${
                subscription.status === 'active' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {subscription.status}
              </span>
            </div>

            {/* Next Billing Date */}
            {subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {subscription.cancelAtPeriodEnd ? 'Expires on' : 'Next billing'}
                </span>
                <span className="text-white text-sm">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription.cancelAtPeriodEnd && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-400 font-medium">Subscription ending</p>
                    <p className="text-gray-400 mt-1">
                      Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
                      You can reactivate anytime from the billing portal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Free Tier Message */}
        {!hasActiveSubscription && (
          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-purple-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-purple-400 font-medium">Free Tier</p>
                <p className="text-gray-400 mt-1">
                  You're using the free tier. Upgrade to unlock more features.
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 mt-2 font-medium"
                >
                  View Plans →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}