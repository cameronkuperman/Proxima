'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { formatFeatureLimit, calculateUsagePercentage, isUnlimited } from '@/types/subscription';
import { CreditCard, Calendar, Zap, AlertCircle, Sparkles, ExternalLink, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SubscriptionCard() {
  const {
    subscription,
    tier,
    promotionalPeriod,
    loading,
    isPromotional,
    hasPaidSubscription,
    currentTierName,
    daysRemainingInPromotional,
    getFeatureUsage,
    getFeatureLimit,
  } = useSubscription();

  const [usage, setUsage] = useState<Record<string, number>>({});
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUsage() {
      if (!tier) return;

      const features = ['oracle_chats', 'quick_scans', 'deep_dives', 'photo_analyses', 'report_generations'];
      const usageData: Record<string, number> = {};

      for (const feature of features) {
        usageData[feature] = await getFeatureUsage(feature);
      }

      setUsage(usageData);
    }

    fetchUsage();
  }, [tier, getFeatureUsage]);

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open billing portal');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
          <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const tierColor = tier?.color || '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Subscription</h3>
        <div className="flex items-center gap-2">
          {isPromotional && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Promotional
            </span>
          )}
          <span 
            className="px-3 py-1 text-xs font-medium rounded-full border"
            style={{
              backgroundColor: `${tierColor}20`,
              borderColor: `${tierColor}40`,
              color: tierColor,
            }}
          >
            {currentTierName} Plan
          </span>
        </div>
      </div>

      {/* Promotional Period Notice */}
      {isPromotional && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/20">
          <div className="flex items-start">
            <Sparkles className="w-5 h-5 text-purple-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                Pro Access Promotional Period
              </p>
              <p className="text-xs text-gray-400">
                You have {daysRemainingInPromotional} days remaining of Pro tier access.
                Enjoy unlimited features during this period!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Overview */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-400">Monthly Usage</h4>
        
        {/* Oracle Chats */}
        <UsageItem
          label="Oracle Chats"
          used={usage.oracle_chats || 0}
          limit={getFeatureLimit('oracleChats')}
          color={tierColor}
        />

        {/* Quick Scans */}
        <UsageItem
          label="Quick Scans"
          used={usage.quick_scans || 0}
          limit={getFeatureLimit('quickScans')}
          color={tierColor}
        />

        {/* Deep Dives */}
        <UsageItem
          label="Deep Dives"
          used={usage.deep_dives || 0}
          limit={getFeatureLimit('deepDives')}
          color={tierColor}
        />

        {/* Photo Analyses */}
        <UsageItem
          label="Photo Analyses"
          used={usage.photo_analyses || 0}
          limit={getFeatureLimit('photoAnalyses')}
          color={tierColor}
        />

        {/* Reports */}
        <UsageItem
          label="Report Generations"
          used={usage.report_generations || 0}
          limit={getFeatureLimit('reportGenerations')}
          color={tierColor}
        />
      </div>

      {/* Billing Information */}
      {hasPaidSubscription && subscription && (
        <div className="space-y-3 mb-6 pt-6 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-400">
              <CreditCard className="w-4 h-4 mr-2" />
              Current plan
            </div>
            <span className="text-sm text-white">
              ${tier?.price[subscription.billingCycle] || 0}/{subscription.billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="w-4 h-4 mr-2" />
              {subscription.cancelAtPeriodEnd ? 'Cancels on' : 'Next billing'}
            </div>
            <span className="text-sm text-white">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-start p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <AlertCircle className="w-4 h-4 text-orange-400 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-orange-400">
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                  Reactivate anytime before then to keep your plan.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {hasPaidSubscription ? (
          <>
            {tier?.name !== 'enterprise' && tier?.name !== 'pro_plus' && (
              <button
                onClick={handleUpgrade}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </button>
            )}
            <button
              onClick={handleManageBilling}
              disabled={isLoadingPortal}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all flex items-center"
            >
              {isLoadingPortal ? 'Loading...' : 'Manage Billing'}
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isPromotional ? 'Subscribe to Continue After Trial' : 'Upgrade to Pro'}
            </button>
            {!isPromotional && (
              <button
                onClick={() => router.push('/pricing')}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all"
              >
                View Plans
              </button>
            )}
          </>
        )}
      </div>

      {/* Feature Perks */}
      {tier && tier.perks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/[0.08]">
          <h4 className="text-xs font-semibold text-gray-400 mb-3">YOUR PLAN INCLUDES</h4>
          <div className="grid grid-cols-2 gap-2">
            {tier.perks.slice(0, 4).map((perk, i) => (
              <div key={i} className="flex items-center text-xs text-gray-300">
                <div 
                  className="w-1.5 h-1.5 rounded-full mr-2"
                  style={{ backgroundColor: tierColor }}
                />
                {perk}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function UsageItem({ 
  label, 
  used, 
  limit, 
  color 
}: { 
  label: string; 
  used: number; 
  limit: number | 'unlimited'; 
  color: string;
}) {
  const unlimited = isUnlimited(limit);
  const percentage = unlimited ? 0 : calculateUsagePercentage(used, limit);
  const isNearLimit = !unlimited && percentage > 80;
  const isAtLimit = !unlimited && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-white mt-0.5">
            {used.toLocaleString()}
            {!unlimited && (
              <span className="text-sm text-gray-400 font-normal">
                {' '}/ {formatFeatureLimit(limit)}
              </span>
            )}
            {unlimited && (
              <span className="text-sm text-gray-400 font-normal"> / ∞</span>
            )}
          </p>
        </div>
        {!unlimited && (
          <p className={`text-xs ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-orange-400' : 'text-gray-400'}`}>
            {percentage.toFixed(0)}% used
          </p>
        )}
      </div>
      
      {!unlimited && (
        <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full transition-colors"
            style={{
              backgroundColor: isAtLimit ? '#ef4444' : isNearLimit ? '#fb923c' : color,
            }}
          />
        </div>
      )}
    </div>
  );
}