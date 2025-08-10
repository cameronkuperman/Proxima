'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { TIERS, formatFeatureLimit } from '@/types/subscription';
import { toast } from 'sonner';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const { user, subscription, tier: currentTier, isPromotional } = useSubscription();

  const handleSubscribe = async (tierName: string) => {
    // Check auth only if not logged in
    if (!user) {
      toast.error('Please sign in to subscribe');
      router.push('/login');
      return;
    }

    if (tierName === 'enterprise') {
      // Redirect to contact form or calendly
      window.open('mailto:help@seimeo.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    if (tierName === 'free') {
      toast.info('You already have access to the free tier');
      return;
    }

    setIsLoading(tierName);

    try {
      // Use test endpoint which handles auth better
      const response = await fetch('/api/stripe/test-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierName,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.hasSubscription) {
          toast.error('You already have an active subscription');
          router.push('/profile');
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
        return;
      }

      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No URL returned from API');
        toast.error('Failed to get checkout URL');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription process');
    } finally {
      setIsLoading(null);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'basic': return <Zap className="w-6 h-6" />;
      case 'pro': return <Sparkles className="w-6 h-6" />;
      case 'pro_plus': return <Crown className="w-6 h-6" />;
      case 'enterprise': return <Building2 className="w-6 h-6" />;
      default: return null;
    }
  };

  const getButtonText = (tierName: string) => {
    if (isLoading === tierName) return 'Processing...';
    if (subscription && currentTier?.name === tierName) return 'Current Plan';
    if (tierName === 'free') return 'Get Started';
    if (tierName === 'enterprise') return 'Contact Sales';
    return 'Subscribe';
  };

  const isCurrentPlan = (tierName: string) => {
    return subscription && currentTier?.name === tierName;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Unlock the full potential of AI-powered health intelligence
            </p>

            {/* Promotional Banner */}
            {isPromotional && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-medium mb-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                You're currently on a 7-day Pro promotional period
              </motion.div>
            )}

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs text-green-400">Save 17%</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.values(TIERS).map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl backdrop-blur-sm border transition-all hover:scale-105 ${
                tier.isRecommended
                  ? 'bg-gradient-to-b from-purple-900/20 to-transparent border-purple-500/50 shadow-xl shadow-purple-500/20'
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              {tier.isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Tier Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{tier.displayName}</h3>
                  <div style={{ color: tier.color }}>
                    {getTierIcon(tier.name)}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {tier.price.monthly !== null ? (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-white">
                          ${billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly}
                        </span>
                        <span className="ml-2 text-gray-400">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && tier.price.monthly! > 0 && (
                        <p className="text-sm text-green-400 mt-1">
                          Save ${(tier.price.monthly! * 12 - tier.price.yearly!).toFixed(0)} per year
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-white">Custom</div>
                  )}
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(tier.name)}
                  disabled={Boolean(isLoading) || Boolean(isCurrentPlan(tier.name))}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    isCurrentPlan(tier.name)
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                      : tier.isRecommended
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {getButtonText(tier.name)}
                </button>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <FeatureItem 
                    label="Oracle Chats" 
                    value={formatFeatureLimit(tier.features.oracleChats)}
                    included={Number(tier.features.oracleChats) > 0}
                  />
                  <FeatureItem 
                    label="Quick Scans" 
                    value={formatFeatureLimit(tier.features.quickScans)}
                    included={Number(tier.features.quickScans) > 0}
                  />
                  <FeatureItem 
                    label="Deep Dives" 
                    value={formatFeatureLimit(tier.features.deepDives)}
                    included={Number(tier.features.deepDives) > 0}
                  />
                  <FeatureItem 
                    label="Photo Analyses" 
                    value={formatFeatureLimit(tier.features.photoAnalyses)}
                    included={Number(tier.features.photoAnalyses) > 0}
                  />
                  <FeatureItem 
                    label="Reports" 
                    value={formatFeatureLimit(tier.features.reportGenerations)}
                    included={Number(tier.features.reportGenerations) > 0}
                  />
                  <FeatureItem 
                    label="Storage" 
                    value={`${formatFeatureLimit(tier.features.storageGB)} GB`}
                    included={Number(tier.features.storageGB) > 0}
                  />
                  <FeatureItem 
                    label="Priority Support" 
                    value=""
                    included={tier.features.prioritySupport}
                    boolean
                  />
                  {tier.features.teamAccounts && (
                    <FeatureItem 
                      label="Team Accounts" 
                      value=""
                      included={true}
                      boolean
                    />
                  )}
                  {tier.features.customBranding && (
                    <FeatureItem 
                      label="Custom Branding" 
                      value=""
                      included={true}
                      boolean
                    />
                  )}
                </div>

                {/* Perks */}
                {tier.perks.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-xs font-semibold text-gray-400 mb-3">INCLUDES</p>
                    <ul className="space-y-2">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <FAQItem
            question="Can I change my plan later?"
            answer="Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately or at the end of your billing cycle."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards and PayPal through our secure payment processor, Stripe."
          />
          <FAQItem
            question="Is there a free trial?"
            answer="All new users get 7 days of Pro tier access to explore all features. No credit card required to start."
          />
          <FAQItem
            question="Can I cancel anytime?"
            answer="Absolutely. You can cancel your subscription at any time, and you'll continue to have access until the end of your billing period."
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="We offer a 30-day money-back guarantee. If you're not satisfied, contact support for a full refund."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ 
  label, 
  value, 
  included, 
  boolean = false 
}: { 
  label: string; 
  value: string; 
  included: boolean;
  boolean?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      {boolean ? (
        included ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <X className="w-4 h-4 text-gray-600" />
        )
      ) : (
        <span className={`font-medium ${included ? 'text-white' : 'text-gray-600'}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-2">{question}</h3>
      <p className="text-gray-400">{answer}</p>
    </motion.div>
  );
}