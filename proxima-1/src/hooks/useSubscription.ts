'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  Tier, 
  Subscription, 
  PromotionalPeriod, 
  UserProfile,
  TIERS,
  getTierByName,
  isUnlimited,
  calculateUsagePercentage
} from '@/types/subscription';

// Create client ONCE outside the component
let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

interface UseSubscriptionReturn {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  tier: Tier | null;
  promotionalPeriod: PromotionalPeriod | null;
  loading: boolean;
  error: string | null;
  
  // Helper properties
  isPromotional: boolean;
  hasPaidSubscription: boolean;
  currentTierName: string;
  daysRemainingInPromotional: number;
  
  // Methods
  checkFeatureAccess: (feature: string) => boolean;
  getFeatureLimit: (feature: string) => number | 'unlimited';
  getFeatureUsage: (feature: string) => Promise<number>;
  canUseFeature: (feature: string) => Promise<boolean>;
  trackUsage: (feature: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [promotionalPeriod, setPromotionalPeriod] = useState<PromotionalPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use stable client instance
  const supabase = useMemo(() => getSupabaseClient(), []);
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches
  const mountedRef = useRef(true); // Track if component is mounted

  const fetchSubscriptionData = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current || !mountedRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (!mountedRef.current) return; // Check if still mounted
      
      if (userError || !currentUser) {
        setUser(null);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      setUser(currentUser);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (!mountedRef.current) return; // Check if still mounted

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData); // Will be null if no profile exists
      }

      // Check for promotional period
      const { data: promoData } = await supabase
        .from('promotional_periods')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .maybeSingle(); // Use maybeSingle instead of single

      if (!mountedRef.current) return; // Check if still mounted

      if (promoData) {
        setPromotionalPeriod({
          ...promoData,
          startDate: new Date(promoData.start_date),
          endDate: new Date(promoData.end_date),
          daysRemaining: Math.ceil(
            (new Date(promoData.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        });
        
        // If promotional period is active, set tier to Pro
        setTier(TIERS.pro);
      }

      // Fetch active subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          pricing_tiers (*)
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle instead of single

      if (!mountedRef.current) return; // Check if still mounted

      if (subData) {
        setSubscription(subData);
        
        // Convert tier data to our Tier type
        if (subData.pricing_tiers) {
          const tierData = subData.pricing_tiers;
          const tierConfig = getTierByName(tierData.name);
          
          if (tierConfig) {
            setTier({
              ...tierConfig,
              id: tierData.id,
              stripePriceIdMonthly: tierData.stripe_price_id_monthly,
              stripePriceIdYearly: tierData.stripe_price_id_yearly,
            });
          }
        }
      } else if (!promoData) {
        // No subscription and no promotional period - use free tier
        setTier(TIERS.free);
      }

    } catch (err: any) {
      if (mountedRef.current) {
        console.error('Error in useSubscription:', err);
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false; // Reset fetch lock
    }
  }, [supabase]); // Keep supabase as dependency since it's memoized now

  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: any = null;

    // Initial fetch
    fetchSubscriptionData();

    // Subscribe to auth changes
    const setupAuthListener = async () => {
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mountedRef.current) return;
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchSubscriptionData();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setSubscription(null);
            setTier(null);
            setPromotionalPeriod(null);
          }
        }
      );
      authSubscription = data.subscription;
    };

    setupAuthListener();

    // Cleanup
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchSubscriptionData]); // Include fetchSubscriptionData as dependency

  // Helper properties
  const isPromotional = !!promotionalPeriod && promotionalPeriod.isActive;
  const hasPaidSubscription = !!subscription && subscription.status === 'active';
  const currentTierName = tier?.displayName || 'Free';
  const daysRemainingInPromotional = promotionalPeriod?.daysRemaining || 0;

  // Check if user has access to a feature
  const checkFeatureAccess = useCallback((feature: string): boolean => {
    if (!tier) return false;
    
    const featureKey = feature as keyof typeof tier.features;
    const limit = tier.features[featureKey];
    
    if (typeof limit === 'boolean') return limit;
    if (typeof limit === 'number' || limit === 'unlimited') {
      if (isUnlimited(limit)) return true;
    }
    
    return typeof limit === 'number' && limit > 0;
  }, [tier]);

  // Get the limit for a feature
  const getFeatureLimit = useCallback((feature: string): number | 'unlimited' => {
    if (!tier) return 0;
    
    const featureKey = feature as keyof typeof tier.features;
    const limit = tier.features[featureKey];
    
    if (typeof limit === 'number' || limit === 'unlimited') {
      return limit;
    }
    
    return 0;
  }, [tier]);

  // Get current usage for a feature
  const getFeatureUsage = useCallback(async (feature: string): Promise<number> => {
    if (!user) return 0;

    const periodStart = subscription?.currentPeriodStart 
      ? new Date(subscription.currentPeriodStart).toISOString()
      : new Date(new Date().setDate(1)).toISOString(); // First of month for free tier

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', feature)
      .gte('period_start', periodStart)
      .maybeSingle(); // Use maybeSingle instead of single

    if (error) {
      console.error('Error fetching usage:', error);
      return 0;
    }

    return data?.usage_count || 0;
  }, [user, subscription, supabase]);

  // Check if user can use a feature (under limit)
  const canUseFeature = useCallback(async (feature: string): Promise<boolean> => {
    if (!user) return false;

    // Use the database function for accurate checking
    const { data, error } = await supabase
      .rpc('check_feature_access', {
        p_user_id: user.id,
        p_feature_key: feature,
      });

    if (error) {
      console.error('Error checking feature access:', error);
      return false;
    }

    return data || false;
  }, [user, supabase]);

  // Track usage of a feature
  const trackUsage = useCallback(async (feature: string): Promise<void> => {
    if (!user) return;

    const periodStart = subscription?.currentPeriodStart 
      ? new Date(subscription.currentPeriodStart).toISOString()
      : new Date(new Date().setDate(1)).toISOString();
    
    const periodEnd = subscription?.currentPeriodEnd 
      ? new Date(subscription.currentPeriodEnd).toISOString()
      : new Date(new Date().setMonth(new Date().getMonth() + 1, 0)).toISOString();

    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_subscription_id: subscription?.id || null,
      p_feature_key: feature,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) {
      console.error('Error tracking usage:', error);
    }
  }, [user, subscription, supabase]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    await fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  return {
    user,
    profile,
    subscription,
    tier,
    promotionalPeriod,
    loading,
    error,
    isPromotional,
    hasPaidSubscription,
    currentTierName,
    daysRemainingInPromotional,
    checkFeatureAccess,
    getFeatureLimit,
    getFeatureUsage,
    canUseFeature,
    trackUsage,
    refreshSubscription,
  };
}