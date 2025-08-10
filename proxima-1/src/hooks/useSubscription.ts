import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface Subscription {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('subscriptions')
          .select('tier, status, current_period_end, cancel_at_period_end')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .single();

        if (error || !data) {
          setSubscription(null);
        } else {
          setSubscription({
            tier: data.tier,
            status: data.status,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  return {
    subscription,
    loading,
    hasActiveSubscription: subscription?.status === 'active' || subscription?.status === 'trialing',
    tier: subscription?.tier || 'free',
  };
}