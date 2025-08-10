-- ============================================
-- STRIPE SUBSCRIPTION SETUP FOR SEIMEO
-- Safe to run multiple times (idempotent)
-- ============================================

-- 1. USER PROFILES TABLE
-- Stores user data and Stripe customer ID
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    stripe_customer_id TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add stripe_customer_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id 
ON user_profiles(stripe_customer_id);

-- 2. SUBSCRIPTIONS TABLE
-- Stores active and past subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'active', 'canceled', 'incomplete', 
        'incomplete_expired', 'past_due', 'trialing', 'unpaid'
    )),
    tier TEXT NOT NULL,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add billing_cycle column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' 
                   AND column_name = 'billing_cycle') THEN
        ALTER TABLE subscriptions ADD COLUMN billing_cycle TEXT 
        CHECK (billing_cycle IN ('monthly', 'yearly'));
    END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id 
ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions(user_id, status);

-- 3. PAYMENT HISTORY TABLE (Optional but recommended)
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

-- 4. PRICING TIERS TABLE (Reference data)
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    monthly_price INTEGER, -- in cents
    yearly_price INTEGER,  -- in cents
    stripe_monthly_price_id TEXT,
    stripe_yearly_price_id TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add missing columns to pricing_tiers if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pricing_tiers' 
                   AND column_name = 'monthly_price') THEN
        ALTER TABLE pricing_tiers ADD COLUMN monthly_price INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pricing_tiers' 
                   AND column_name = 'yearly_price') THEN
        ALTER TABLE pricing_tiers ADD COLUMN yearly_price INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pricing_tiers' 
                   AND column_name = 'features') THEN
        ALTER TABLE pricing_tiers ADD COLUMN features JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pricing_tiers' 
                   AND column_name = 'limits') THEN
        ALTER TABLE pricing_tiers ADD COLUMN limits JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pricing_tiers' 
                   AND column_name = 'sort_order') THEN
        ALTER TABLE pricing_tiers ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Insert or update pricing tiers
INSERT INTO pricing_tiers (name, display_name, description, monthly_price, yearly_price, features, limits, sort_order)
VALUES 
    ('free', 'Free', 'Get started with basic features', 0, 0, 
     '["3 AI health analyses per month", "Basic symptom checker", "Limited photo analysis"]'::jsonb,
     '{"ai_analyses": 3, "photo_analyses": 1}'::jsonb, 0),
    
    ('basic', 'Basic', 'For individuals tracking their health', 999, 9900,
     '["10 AI health analyses per month", "Advanced symptom checker", "5 photo analyses", "Basic reports"]'::jsonb,
     '{"ai_analyses": 10, "photo_analyses": 5}'::jsonb, 1),
    
    ('pro', 'Pro', 'For power users and families', 1999, 19900,
     '["Unlimited AI analyses", "Priority AI models", "Unlimited photo analyses", "Detailed reports", "Export to PDF"]'::jsonb,
     '{"ai_analyses": -1, "photo_analyses": -1}'::jsonb, 2),
    
    ('pro_plus', 'Pro Plus', 'Maximum features and support', 3999, 39900,
     '["Everything in Pro", "GPT-4 & Claude Opus access", "API access", "Priority support", "Custom integrations"]'::jsonb,
     '{"ai_analyses": -1, "photo_analyses": -1, "api_access": true}'::jsonb, 3)
     
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    sort_order = EXCLUDED.sort_order,
    updated_at = TIMEZONE('utc', NOW());

-- 5. PROMOTIONAL PERIODS TABLE (For trials/discounts)
CREATE TABLE IF NOT EXISTS promotional_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('trial', 'discount', 'gift')),
    tier TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_promotional_periods_user_id ON promotional_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_promotional_periods_active 
ON promotional_periods(user_id, is_active, end_date);

-- 6. USAGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, feature, period_start, period_end)
);

-- Add feature column if it doesn't exist (in case table exists with different structure)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usage_tracking' 
                   AND column_name = 'feature') THEN
        ALTER TABLE usage_tracking ADD COLUMN feature TEXT NOT NULL DEFAULT 'unknown';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature 
ON usage_tracking(user_id, feature, period_start);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
    -- User Profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    
    CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
    
    -- Subscriptions policies
    DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
    
    CREATE POLICY "Users can view own subscriptions" ON subscriptions
        FOR SELECT USING (auth.uid() = user_id);
    
    -- Payment History policies
    DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
    
    CREATE POLICY "Users can view own payment history" ON payment_history
        FOR SELECT USING (auth.uid() = user_id);
    
    -- Promotional Periods policies
    DROP POLICY IF EXISTS "Users can view own promotional periods" ON promotional_periods;
    
    CREATE POLICY "Users can view own promotional periods" ON promotional_periods
        FOR SELECT USING (auth.uid() = user_id);
    
    -- Usage Tracking policies
    DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
    
    CREATE POLICY "Users can view own usage" ON usage_tracking
        FOR SELECT USING (auth.uid() = user_id);
        
    -- Pricing Tiers - public read
    DROP POLICY IF EXISTS "Anyone can view pricing tiers" ON pricing_tiers;
    
    CREATE POLICY "Anyone can view pricing tiers" ON pricing_tiers
        FOR SELECT USING (true);
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- 8. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    tier TEXT,
    status TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.tier,
        s.status,
        s.current_period_end,
        s.cancel_at_period_end
    FROM subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        CREATE TRIGGER update_subscriptions_updated_at
            BEFORE UPDATE ON subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pricing_tiers_updated_at') THEN
        CREATE TRIGGER update_pricing_tiers_updated_at
            BEFORE UPDATE ON pricing_tiers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. GRANT PERMISSIONS (for service role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Stripe setup completed successfully!';
END $$;