'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Loader2, Zap } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'success' | 'error'>('syncing');
  const [message, setMessage] = useState('Setting up your subscription...');
  const [tierName, setTierName] = useState<string>('');

  useEffect(() => {
    // Fire confetti on mount
    const fireConfetti = () => {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#c084fc']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#c084fc']
        });
      }, 250);
    };

    fireConfetti();
    syncSubscription();
  }, []);

  const syncSubscription = async () => {
    try {
      // Wait a bit to ensure Stripe webhook has time to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage('Verifying your payment...');

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Wait a bit more for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessage('Activating your subscription features...');

      // Force sync the subscription
      const response = await fetch('/api/stripe/force-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to sync subscription');
      }

      // Get the tier name from the synced data
      if (data.currentSubscriptions && data.currentSubscriptions.length > 0) {
        const tier = data.currentSubscriptions[0].tier;
        setTierName(tier.replace('_', ' ').toUpperCase());
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Success! Your subscription is active.');
      setSyncStatus('success');

      // Redirect after showing success
      setTimeout(() => {
        router.push('/profile?welcome=true');
      }, 3000);

    } catch (error: any) {
      console.error('Sync error:', error);
      setMessage('There was an issue setting up your subscription. Redirecting...');
      setSyncStatus('error');
      
      // Still redirect to profile even on error
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          {syncStatus === 'success' ? (
            <div className="relative">
              <CheckCircle className="w-24 h-24 text-green-400" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
          ) : syncStatus === 'error' ? (
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
          ) : (
            <div className="relative">
              <Loader2 className="w-24 h-24 text-purple-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          {syncStatus === 'success' ? '🎉 Welcome to Seimeo!' : 'Thank You!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-300 mb-2"
        >
          {syncStatus === 'success' 
            ? `Your ${tierName} subscription is now active!`
            : 'Your payment was successful'
          }
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-8"
        >
          {message}
        </motion.p>

        {syncStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-medium">
              <Sparkles className="w-5 h-5 mr-2" />
              Redirecting to your profile...
            </div>
            
            <div className="text-sm text-gray-500">
              You can now access all your subscription features
            </div>
          </motion.div>
        )}

        {syncStatus === 'syncing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center space-x-2"
          >
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}