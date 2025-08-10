import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface Subscription {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

let isSubscriptionFetching = false;

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Prevent multiple simultaneous fetches
    if (isSubscriptionFetching || hasFetched) {
      return;
    }
    
    async function fetchSubscription() {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        setHasFetched(true);
        return;
      }

      try {
        isSubscriptionFetching = true;
        const supabase = createClient();
        
        // Use maybeSingle() instead of single() to avoid error when no rows found
        const { data, error } = await supabase
          .from('subscriptions')
          .select('tier, status, current_period_end, cancel_at_period_end')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .maybeSingle(); // This won't error if no rows are found

        if (error) {
          // Silently handle - user just has no subscription
          console.log('No active subscription found');
          setSubscription(null);
        } else if (data) {
          setSubscription({
            tier: data.tier,
            status: data.status,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
          });
        } else {
          // No subscription found
          setSubscription(null);
        }
      } catch (error) {
        // Silently handle errors
        setSubscription(null);
      } finally {
        setLoading(false);
        setHasFetched(true);
        isSubscriptionFetching = false;
      }
    }

    fetchSubscription();
  }, [user?.id, hasFetched]); // Dependencies

  // Reset hasFetched when user changes
  useEffect(() => {
    setHasFetched(false);
  }, [user?.id]);

  return {
    subscription,
    loading,
    hasActiveSubscription: subscription?.status === 'active' || subscription?.status === 'trialing',
    tier: subscription?.tier || 'free',
  };
}