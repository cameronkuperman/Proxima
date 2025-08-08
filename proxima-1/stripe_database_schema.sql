-- Stripe Payment Integration Database Schema
-- Run these commands in your Supabase SQL editor in order

-- 1. Create user_profiles table for extended user data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  promotional_period_start TIMESTAMP WITH TIME ZONE,
  promotional_period_end TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);

-- 2. Create pricing_tiers table
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  stripe_price_id_monthly TEXT UNIQUE,
  stripe_price_id_yearly TEXT UNIQUE,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  currency TEXT DEFAULT 'usd',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Feature Limits (set to specific values for launch)
  oracle_chats_limit INTEGER DEFAULT 5,  -- Free tier: 5, Basic: 20, Pro: 100, Pro+: unlimited(-1), Enterprise: unlimited(-1)
  quick_scans_limit INTEGER DEFAULT 10,  -- Free tier: 10, Basic: 50, Pro: 200, Pro+: unlimited(-1), Enterprise: unlimited(-1)
  deep_dives_limit INTEGER DEFAULT 1,    -- Free tier: 1, Basic: 5, Pro: 20, Pro+: unlimited(-1), Enterprise: unlimited(-1)
  photo_analyses_limit INTEGER DEFAULT 5, -- Free tier: 5, Basic: 20, Pro: 100, Pro+: unlimited(-1), Enterprise: unlimited(-1)
  report_generations_limit INTEGER DEFAULT 2, -- Free tier: 2, Basic: 10, Pro: 50, Pro+: unlimited(-1), Enterprise: unlimited(-1)
  api_calls_limit INTEGER DEFAULT 100,   -- Per month API calls
  storage_limit_gb DECIMAL(10, 2) DEFAULT 1, -- Storage in GB
  
  -- Tier Settings
  color TEXT DEFAULT '#6366f1',
  badge TEXT,
  is_recommended BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers with actual limits
INSERT INTO pricing_tiers (name, display_name, price_monthly, price_yearly, oracle_chats_limit, quick_scans_limit, deep_dives_limit, photo_analyses_limit, report_generations_limit, api_calls_limit, storage_limit_gb, color, is_recommended, sort_order) VALUES
('free', 'Free', 0, 0, 5, 10, 1, 5, 2, 100, 1, '#6b7280', false, 1),
('basic', 'Basic', 5.00, 50.00, 20, 50, 5, 20, 10, 500, 5, '#3b82f6', false, 2),
('pro', 'Pro', 20.00, 200.00, 100, 200, 20, 100, 50, 2000, 20, '#8b5cf6', true, 3),
('pro_plus', 'Pro+', 50.00, 500.00, -1, -1, -1, -1, -1, 10000, 100, '#ec4899', false, 4),
('enterprise', 'Enterprise', NULL, NULL, -1, -1, -1, -1, -1, -1, -1, '#dc2626', false, 5);

-- 3. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  tier_id UUID REFERENCES pricing_tiers(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 4. Create payment_history table for complete audit trail
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  payment_method TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);

-- 5. Create promotional_periods table for tracking 7-day Pro access
CREATE TABLE IF NOT EXISTS promotional_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier_id UUID REFERENCES pricing_tiers(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0, -- Track how many times they've used promotional period
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promotional_periods_user_id ON promotional_periods(user_id);
CREATE INDEX idx_promotional_periods_end_date ON promotional_periods(end_date);

-- 6. Create subscription_features table for tier-specific features
CREATE TABLE IF NOT EXISTS subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_value TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tier_id, feature_key)
);

-- 7. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, feature_key, period_start)
);

CREATE INDEX idx_usage_tracking_user_period ON usage_tracking(user_id, period_start, period_end);

-- 8. Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- 9. Create admin_users table for admin console access
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'support')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- 10. Create functions for usage tracking and feature access

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_subscription_id UUID,
  p_feature_key TEXT,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (
    user_id,
    subscription_id,
    feature_key,
    usage_count,
    period_start,
    period_end
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_feature_key,
    1,
    p_period_start,
    p_period_end
  )
  ON CONFLICT (user_id, feature_key, period_start)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check feature access (includes promotional period logic)
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_tier RECORD;
  v_promotional RECORD;
  v_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- First check if user has an active promotional period
  SELECT * INTO v_promotional
  FROM promotional_periods
  WHERE user_id = p_user_id
    AND is_active = true
    AND NOW() BETWEEN start_date AND end_date
  LIMIT 1;
  
  -- If promotional period is active, use Pro tier limits
  IF FOUND THEN
    SELECT * INTO v_tier
    FROM pricing_tiers
    WHERE name = 'pro';
    
    -- Get usage for promotional period
    SELECT COALESCE(SUM(usage_count), 0) INTO v_usage
    FROM usage_tracking
    WHERE user_id = p_user_id
      AND feature_key = p_feature_key
      AND period_start >= v_promotional.start_date;
  ELSE
    -- Check for active subscription
    SELECT s.*, t.*
    INTO v_subscription
    FROM subscriptions s
    JOIN pricing_tiers t ON s.tier_id = t.id
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
    LIMIT 1;

    -- If no subscription, use free tier
    IF NOT FOUND THEN
      SELECT * INTO v_tier
      FROM pricing_tiers
      WHERE name = 'free';
      
      -- Get usage for free tier (monthly)
      SELECT COALESCE(SUM(usage_count), 0) INTO v_usage
      FROM usage_tracking
      WHERE user_id = p_user_id
        AND feature_key = p_feature_key
        AND period_start >= DATE_TRUNC('month', CURRENT_DATE);
    ELSE
      v_tier := v_subscription;
      -- Get usage for subscription period
      SELECT COALESCE(SUM(usage_count), 0) INTO v_usage
      FROM usage_tracking
      WHERE subscription_id = v_subscription.id
        AND feature_key = p_feature_key
        AND period_start >= v_subscription.current_period_start
        AND period_end <= v_subscription.current_period_end;
    END IF;
  END IF;
  
  -- Get the limit for the feature
  v_limit := CASE p_feature_key
    WHEN 'oracle_chats' THEN v_tier.oracle_chats_limit
    WHEN 'quick_scans' THEN v_tier.quick_scans_limit
    WHEN 'deep_dives' THEN v_tier.deep_dives_limit
    WHEN 'photo_analyses' THEN v_tier.photo_analyses_limit
    WHEN 'report_generations' THEN v_tier.report_generations_limit
    WHEN 'api_calls' THEN v_tier.api_calls_limit
    ELSE 0
  END;

  -- Check if unlimited (-1) or under limit
  RETURN v_limit = -1 OR v_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current tier (including promotional)
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID) 
RETURNS TABLE(
  tier_name TEXT,
  display_name TEXT,
  is_promotional BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  -- Check for active promotional period first
  IF EXISTS (
    SELECT 1 FROM promotional_periods
    WHERE user_id = p_user_id
      AND is_active = true
      AND NOW() BETWEEN start_date AND end_date
  ) THEN
    RETURN QUERY
    SELECT 
      'pro'::TEXT as tier_name,
      'Pro (Promotional)'::TEXT as display_name,
      true as is_promotional,
      EXTRACT(DAY FROM (pp.end_date - NOW()))::INTEGER as days_remaining
    FROM promotional_periods pp
    WHERE pp.user_id = p_user_id
      AND pp.is_active = true
      AND NOW() BETWEEN pp.start_date AND pp.end_date
    LIMIT 1;
  ELSE
    -- Check for active subscription
    IF EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = p_user_id AND status = 'active'
    ) THEN
      RETURN QUERY
      SELECT 
        pt.name::TEXT as tier_name,
        pt.display_name::TEXT as display_name,
        false as is_promotional,
        0 as days_remaining
      FROM subscriptions s
      JOIN pricing_tiers pt ON s.tier_id = pt.id
      WHERE s.user_id = p_user_id AND s.status = 'active'
      LIMIT 1;
    ELSE
      -- Default to free tier
      RETURN QUERY
      SELECT 
        'free'::TEXT as tier_name,
        'Free'::TEXT as display_name,
        false as is_promotional,
        0 as days_remaining;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to automatically create promotional period for new users
CREATE OR REPLACE FUNCTION create_promotional_period_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create 7-day Pro promotional period
  INSERT INTO promotional_periods (
    user_id,
    tier_id,
    start_date,
    end_date,
    is_active
  )
  SELECT 
    NEW.id,
    pt.id,
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  FROM pricing_tiers pt
  WHERE pt.name = 'pro'
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_promotional_period_for_new_user();

-- 12. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS Policies

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Pricing tiers policies (everyone can view)
CREATE POLICY "Anyone can view pricing tiers" ON pricing_tiers
  FOR SELECT TO public USING (true);

-- Payment history policies
CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Promotional periods policies
CREATE POLICY "Users can view own promotional period" ON promotional_periods
  FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (admins can see everything)
CREATE POLICY "Admins can view all data" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 14. Create indexes for performance
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_payment_history_user_created ON payment_history(user_id, created_at DESC);
CREATE INDEX idx_promotional_active ON promotional_periods(is_active, end_date) WHERE is_active = true;