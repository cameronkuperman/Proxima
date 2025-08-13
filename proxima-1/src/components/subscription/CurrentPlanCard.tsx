'use client';

import { motion } from 'framer-motion';
import { Crown, Zap, Sparkles, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CurrentPlanCardProps {
  subscription: any;
  tier: string;
  status: string;
  upcomingInvoice: any;
  onManageBilling: () => void;
  onCancelPlan: () => void;
  onResumePlan: () => void;
}

export default function CurrentPlanCard({
  subscription,
  tier,
  status,
  upcomingInvoice,
  onManageBilling,
  onCancelPlan,
  onResumePlan,
}: CurrentPlanCardProps) {
  
  const getTierIcon = () => {
    switch (tier) {
      case 'pro_plus':
        return <Crown className="w-6 h-6" />;
      case 'pro':
        return <Sparkles className="w-6 h-6" />;
      case 'basic':
        return <Zap className="w-6 h-6" />;
      default:
        return null;
    }
  };
  
  const getTierColor = () => {
    switch (tier) {
      case 'pro_plus':
        return 'from-pink-600 to-purple-600';
      case 'pro':
        return 'from-purple-600 to-blue-600';
      case 'basic':
        return 'from-blue-600 to-cyan-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };
  
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        if (subscription?.cancel_at_period_end) {
          return (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
              Canceling
            </span>
          );
        }
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
            Active
          </span>
        );
      case 'trialing':
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
            Trial
          </span>
        );
      case 'past_due':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
            Past Due
          </span>
        );
      case 'canceled':
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
            Canceled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
            Free
          </span>
        );
    }
  };
  
  const getPlanPrice = () => {
    // You can determine this from the upcoming invoice or subscription data
    if (upcomingInvoice) {
      return `$${upcomingInvoice.amount}/${upcomingInvoice.currency === 'usd' ? 'month' : upcomingInvoice.currency}`;
    }
    return tier === 'free' ? 'Free' : 'Contact support';
  };
  
  if (!subscription && tier === 'free') {
    // Free tier card
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Free Plan</h2>
            <p className="text-gray-400">Limited access to features</p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span>No subscription required</span>
          </div>
          
          <div className="pt-4 border-t border-white/[0.05]">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getTierColor()} flex items-center justify-center text-white`}>
            {getTierIcon()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {tier.replace('_', ' ').charAt(0).toUpperCase() + tier.replace('_', ' ').slice(1)} Plan
            </h2>
            <p className="text-gray-400">{getPlanPrice()}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Warning for past due */}
      {status === 'past_due' && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 text-sm">
            Payment failed. Please update your payment method to avoid service interruption.
          </span>
        </div>
      )}
      
      {/* Cancellation notice */}
      {subscription?.cancel_at_period_end && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Subscription ending</span>
          </div>
          <p className="text-sm text-gray-300">
            Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}.
            You'll retain access until then.
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Next billing date */}
        {upcomingInvoice && !subscription?.cancel_at_period_end && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-300">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span>Next billing date</span>
            </div>
            <span className="text-white font-medium">
              {new Date(upcomingInvoice.date).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {/* Subscription since */}
        {subscription && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle className="w-5 h-5 text-gray-500" />
              <span>Member since</span>
            </div>
            <span className="text-white font-medium">
              {formatDistanceToNow(new Date(subscription.created_at), { addSuffix: true })}
            </span>
          </div>
        )}
        
        {/* Actions */}
        <div className="pt-4 border-t border-white/[0.05] space-y-3">
          <button
            onClick={onManageBilling}
            className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium rounded-lg border border-white/[0.1] transition-all"
          >
            Manage Billing & Invoices
          </button>
          
          {subscription?.cancel_at_period_end ? (
            <button
              onClick={onResumePlan}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all"
            >
              Resume Subscription
            </button>
          ) : (
            status === 'active' && (
              <button
                onClick={onCancelPlan}
                className="w-full py-3 text-gray-400 hover:text-red-400 font-medium transition-all"
              >
                Cancel Subscription
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}