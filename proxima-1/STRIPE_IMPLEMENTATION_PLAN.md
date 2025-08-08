# Stripe Payments & Membership Tiers Implementation Plan

## Implementation Approach
This implementation sets up a complete Stripe payment infrastructure with **no initial restrictions or throttling**. All tiers have unlimited access to all features initially, but the system is fully prepared to add restrictions, limits, and tier-specific perks through the admin console when needed.

### Current Tier Structure:
- **Free** - $0/month
- **Basic** - $5/month ($50/year)
- **Pro** - $20/month ($200/year) 
- **Pro+** - $50/month ($500/year)
- **Enterprise** - Custom pricing (contact sales)

### Key Features:
- ✅ Full payment processing with Stripe
- ✅ Subscription management 
- ✅ Customer portal for self-service
- ✅ Admin console for tier configuration
- ✅ Usage tracking (for analytics, not restrictions)
- ✅ Infrastructure ready for future feature gating
- ❌ No throttling or limits (can be enabled later)
- ❌ No tier-specific perks (can be added later)

## Overview
This document outlines the complete implementation plan for integrating Stripe payments and membership tiers into the Proxima-1 health platform. The system supports multiple subscription tiers, all manageable through an admin console.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Stripe Setup](#stripe-setup)
4. [API Implementation](#api-implementation)
5. [Membership Tiers](#membership-tiers)
6. [Feature Gating System](#feature-gating-system)
7. [Admin Console](#admin-console)
8. [Frontend Components](#frontend-components)
9. [Webhook Handling](#webhook-handling)
10. [Testing Strategy](#testing-strategy)

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js App   │────▶│  Stripe API  │────▶│   Stripe    │
│   (Frontend)    │◀────│   Routes     │◀────│   Service   │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      │                     │
         ▼                      ▼                     ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Supabase DB   │────▶│   Webhooks   │────▶│   Console   │
│  (User/Subs)    │     │   Handler    │     │    Admin    │
└─────────────────┘     └──────────────┘     └─────────────┘
```

## Database Schema

### 1. Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  tier_id UUID REFERENCES pricing_tiers(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 2. Pricing Tiers Table
```sql
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  stripe_price_id TEXT UNIQUE,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  currency TEXT DEFAULT 'usd',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Feature Limits (set to -1 for unlimited/no restrictions initially)
  oracle_chats_limit INTEGER DEFAULT -1,
  quick_scans_limit INTEGER DEFAULT -1,
  deep_dives_limit INTEGER DEFAULT -1,
  photo_analyses_limit INTEGER DEFAULT -1,
  report_generations_limit INTEGER DEFAULT -1,
  api_calls_limit INTEGER DEFAULT -1,
  storage_limit_gb DECIMAL(10, 2) DEFAULT -1,
  
  -- Tier Settings
  color TEXT DEFAULT '#6366f1',
  badge TEXT,
  is_recommended BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers (no restrictions initially, -1 means unlimited)
INSERT INTO pricing_tiers (name, display_name, price_monthly, price_yearly, oracle_chats_limit, quick_scans_limit, deep_dives_limit) VALUES
('free', 'Free', 0, 0, -1, -1, -1),
('basic', 'Basic', 5.00, 50.00, -1, -1, -1),
('pro', 'Pro', 20.00, 200.00, -1, -1, -1),
('pro_plus', 'Pro+', 50.00, 500.00, -1, -1, -1),
('enterprise', 'Enterprise', NULL, NULL, -1, -1, -1); -- Custom pricing
```

### 3. Subscription Features Table
```sql
CREATE TABLE subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_value TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tier_id, feature_key)
);

-- Features table is ready for future features but empty initially
-- Examples of features that can be added later:
-- - priority_support
-- - advanced_analytics
-- - export_formats
-- - api_access
-- - dedicated_support
-- - custom_branding
-- - team_accounts
```

### 4. Usage Tracking Table
```sql
CREATE TABLE usage_tracking (
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
```

### 5. Add Stripe Customer ID to Users
```sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON auth.users(stripe_customer_id);
```

## Stripe Setup

### 1. Install Dependencies
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Environment Variables
```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production prices
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_...
STRIPE_PRICE_PRO_PLUS_YEARLY=price_...
# Enterprise pricing handled through custom quotes
```

### 3. Stripe Configuration
```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Client-side Stripe
// src/lib/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

## API Implementation

### 1. Create Checkout Session
```typescript
// src/app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { priceId, mode = 'subscription' } = await req.json();
    
    // Get user from Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Stripe customer
    let customerId = user.user_metadata?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to Supabase
      await supabase.auth.updateUser({
        data: { stripe_customer_id: customerId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 2. Webhook Handler
```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Get price details to determine tier
        const price = subscription.items.data[0].price;
        const { data: tier } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('stripe_price_id', price.id)
          .single();

        // Create subscription record
        await supabase.from('subscriptions').insert({
          user_id: session.metadata?.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          tier_id: tier?.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get price details to determine tier
        const price = subscription.items.data[0].price;
        const { data: tier } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('stripe_price_id', price.id)
          .single();

        // Update subscription
        await supabase
          .from('subscriptions')
          .update({
            tier_id: tier?.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Reset usage limits for new billing period
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          await supabase
            .from('usage_tracking')
            .delete()
            .eq('subscription_id', subscription.id)
            .lt('period_end', new Date().toISOString());
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Update subscription status
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### 3. Customer Portal
```typescript
// src/app/api/stripe/create-portal-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer ID from subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

## Membership Tiers

### Tier Structure
```typescript
// src/types/subscription.ts
export interface Tier {
  id: string;
  name: 'free' | 'basic' | 'pro' | 'pro_plus' | 'enterprise';
  displayName: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  features: {
    // All features unlimited by default (no throttling initially)
    oracleChats: 'unlimited';
    quickScans: 'unlimited';
    deepDives: 'unlimited';
    photoAnalyses: 'unlimited';
    reportGenerations: 'unlimited';
    apiCalls: 'unlimited';
    storageGB: 'unlimited';
    // Future feature flags (all enabled for now)
    prioritySupport: boolean;
    customBranding: boolean;
    teamAccounts: boolean;
    advancedAnalytics: boolean;
    exportFormats: string[];
  };
  perks: string[]; // Empty initially, can be added later
  color: string;
  isRecommended: boolean;
}

export const TIERS: Record<string, Tier> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: { monthly: 0, yearly: 0 },
    features: {
      // No restrictions for now
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 'unlimited',
      storageGB: 'unlimited',
      // Feature flags for future use
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    perks: [], // To be defined later
    color: '#6b7280',
    isRecommended: false,
  },
  basic: {
    id: 'basic',
    name: 'basic',
    displayName: 'Basic',
    price: { monthly: 5.00, yearly: 50.00 },
    features: {
      // No restrictions for now
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 'unlimited',
      storageGB: 'unlimited',
      // Feature flags for future use
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    perks: [], // To be defined later
    color: '#3b82f6',
    isRecommended: false,
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: { monthly: 20.00, yearly: 200.00 },
    features: {
      // No restrictions for now
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 'unlimited',
      storageGB: 'unlimited',
      // Feature flags for future use
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    perks: [], // To be defined later
    color: '#8b5cf6',
    isRecommended: true,
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'pro_plus',
    displayName: 'Pro+',
    price: { monthly: 50.00, yearly: 500.00 },
    features: {
      // No restrictions for now
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 'unlimited',
      storageGB: 'unlimited',
      // Feature flags for future use
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json', 'xml'],
    },
    perks: [], // To be defined later
    color: '#ec4899',
    isRecommended: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    price: { monthly: null, yearly: null }, // Custom pricing
    features: {
      // No restrictions
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 'unlimited',
      storageGB: 'unlimited',
      // Feature flags for future use
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json', 'xml', 'hl7'],
    },
    perks: [], // To be defined later
    color: '#dc2626',
    isRecommended: false,
  },
};
```

## Feature Gating System

### 1. Subscription Hook (Simplified - No Restrictions Initially)
```typescript
// src/hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [tier, setTier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select(`
          *,
          pricing_tiers (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (sub) {
        setSubscription(sub);
        setTier(sub.pricing_tiers);
      } else {
        // Default to free tier
        const { data: freeTier } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('name', 'free')
          .single();
        
        setTier(freeTier);
      }

      setLoading(false);
    }

    fetchSubscription();
  }, [supabase]);

  // Simplified functions - no restrictions for now
  const checkFeatureAccess = (feature: string): boolean => {
    // All features accessible for all tiers initially
    return true;
  };

  const getFeatureLimit = (feature: string): 'unlimited' => {
    // Everything is unlimited initially
    return 'unlimited';
  };

  const canUseFeature = async (feature: string): Promise<boolean> => {
    // All features available for all users initially
    return true;
  };

  const trackUsage = async (feature: string) => {
    // Still track usage for future analytics
    if (!subscription) return;

    await supabase.rpc('increment_usage', {
      p_user_id: subscription.user_id,
      p_subscription_id: subscription.id,
      p_feature_key: feature,
      p_period_start: subscription.current_period_start,
      p_period_end: subscription.current_period_end,
    });
  };

  // Helper function to check if user has paid subscription
  const hasPaidSubscription = (): boolean => {
    return tier && tier.name !== 'free';
  };

  // Helper function to get tier display info
  const getTierInfo = () => {
    return {
      name: tier?.display_name || 'Free',
      color: tier?.color || '#6b7280',
      price: tier?.price_monthly || 0,
      isEnterprise: tier?.name === 'enterprise',
    };
  };

  return {
    subscription,
    tier,
    loading,
    checkFeatureAccess,
    getFeatureLimit,
    canUseFeature,
    trackUsage,
    hasPaidSubscription,
    getTierInfo,
  };
}
```

### 2. Feature Gate Component (Ready for Future Use)
```typescript
// src/components/FeatureGate.tsx
import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';

interface FeatureGateProps {
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
  requireTier?: 'basic' | 'pro' | 'pro_plus' | 'enterprise';
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  requireTier 
}: FeatureGateProps) {
  const { tier, checkFeatureAccess } = useSubscription();

  // For now, all features are accessible
  // This component is ready for when you want to add restrictions
  const hasAccess = () => {
    // Uncomment when ready to enable tier restrictions
    // const tierHierarchy = ['free', 'basic', 'pro', 'pro_plus', 'enterprise'];
    // if (requireTier) {
    //   const currentTierIndex = tierHierarchy.indexOf(tier?.name || 'free');
    //   const requiredTierIndex = tierHierarchy.indexOf(requireTier);
    //   return currentTierIndex >= requiredTierIndex;
    // }
    
    // For now, everyone has access
    return true;
  };

  if (!hasAccess()) {
    return fallback || (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">
          Upgrade Required
        </h3>
        <p className="text-gray-400 mb-4">
          This feature requires a {requireTier || 'paid'} subscription.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          View Plans
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 3. API Middleware (Ready for Future Restrictions)
```typescript
// src/middleware/subscription.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function subscriptionMiddleware(req: NextRequest, feature: string) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get subscription status (for analytics and future restrictions)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      pricing_tiers (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // For now, no restrictions - everyone can use all features
  // Uncomment the following when ready to enable restrictions:
  
  /*
  if (!subscription) {
    // Free tier limit checking
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_key', feature)
      .single();

    const freeLimit = 5; // Configure as needed
    if (usage && usage.usage_count >= freeLimit) {
      return NextResponse.json(
        { error: 'Free tier limit exceeded' },
        { status: 402 }
      );
    }
  } else {
    const limit = subscription.pricing_tiers[`${feature}_limit`];
    
    if (limit !== -1) { // -1 means unlimited
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('subscription_id', subscription.id)
        .eq('feature_key', feature)
        .gte('period_start', subscription.current_period_start)
        .lte('period_end', subscription.current_period_end)
        .single();

      if (usage && usage.usage_count >= limit) {
        return NextResponse.json(
          { error: 'Subscription limit exceeded' },
          { status: 402 }
        );
      }
    }
  }
  */

  // Still track usage for analytics (even though not restricting)
  await supabase.rpc('increment_usage', {
    p_user_id: user.id,
    p_subscription_id: subscription?.id,
    p_feature_key: feature,
    p_period_start: subscription?.current_period_start || new Date().toISOString(),
    p_period_end: subscription?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return null; // Continue with request - no restrictions
}
```

## Admin Console

### 1. Admin Dashboard
```typescript
// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [tiers, setTiers] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    // Fetch subscription stats
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('tier_id, status');

    // Fetch tier information
    const { data: tierData } = await supabase
      .from('pricing_tiers')
      .select('*')
      .order('sort_order');

    setTiers(tierData || []);

    // Calculate stats
    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
    const revenue = calculateRevenue(activeSubscriptions, tierData || []);
    
    setStats({
      totalUsers: subscriptions?.length || 0,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRevenue: revenue.monthly,
      yearlyRevenue: revenue.yearly,
      churnRate: calculateChurnRate(subscriptions || []),
    });
  }

  function calculateRevenue(subscriptions: any[], tiers: any[]) {
    let monthly = 0;
    let yearly = 0;

    subscriptions.forEach(sub => {
      const tier = tiers.find(t => t.id === sub.tier_id);
      if (tier) {
        monthly += tier.price_monthly || 0;
        yearly += tier.price_yearly || 0;
      }
    });

    return { monthly, yearly };
  }

  function calculateChurnRate(subscriptions: any[]) {
    const total = subscriptions.length;
    const canceled = subscriptions.filter(s => s.status === 'canceled').length;
    return total > 0 ? ((canceled / total) * 100).toFixed(2) : 0;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change="+12%"
          isPositive={true}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          change="+8%"
          isPositive={true}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue?.toFixed(2)}`}
          change="+15%"
          isPositive={true}
        />
        <StatCard
          title="Churn Rate"
          value={`${stats.churnRate}%`}
          change="-2%"
          isPositive={false}
        />
      </div>

      {/* Tier Management */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Tier Management</h2>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Add New Tier
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-4 text-gray-400">Tier</th>
                <th className="pb-4 text-gray-400">Monthly Price</th>
                <th className="pb-4 text-gray-400">Yearly Price</th>
                <th className="pb-4 text-gray-400">Active Users</th>
                <th className="pb-4 text-gray-400">Status</th>
                <th className="pb-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map(tier => (
                <TierRow key={tier.id} tier={tier} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive }: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className="text-2xl font-bold text-white mb-2">{value}</p>
      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {change} from last month
      </p>
    </div>
  );
}

function TierRow({ tier }: any) {
  return (
    <tr className="border-b border-gray-700">
      <td className="py-4 text-white font-medium">{tier.display_name}</td>
      <td className="py-4 text-gray-300">${tier.price_monthly}</td>
      <td className="py-4 text-gray-300">${tier.price_yearly}</td>
      <td className="py-4 text-gray-300">0</td>
      <td className="py-4">
        <span className={`px-2 py-1 text-xs rounded-full ${
          tier.is_active 
            ? 'bg-green-500/20 text-green-500' 
            : 'bg-gray-500/20 text-gray-500'
        }`}>
          {tier.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-4">
        <button className="text-purple-400 hover:text-purple-300 mr-4">Edit</button>
        <button className="text-red-400 hover:text-red-300">Delete</button>
      </td>
    </tr>
  );
}
```

### 2. Tier Configuration Page
```typescript
// src/app/admin/tiers/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TierConfiguration() {
  const params = useParams();
  const router = useRouter();
  const [tier, setTier] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (params.id) {
      fetchTierData();
    }
  }, [params.id]);

  async function fetchTierData() {
    const { data: tierData } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data: featuresData } = await supabase
      .from('subscription_features')
      .select('*')
      .eq('tier_id', params.id);

    setTier(tierData);
    setFeatures(featuresData || []);
  }

  async function handleSave() {
    // Update tier
    const { error: tierError } = await supabase
      .from('pricing_tiers')
      .update(tier)
      .eq('id', params.id);

    if (tierError) {
      console.error('Error updating tier:', tierError);
      return;
    }

    // Update features
    for (const feature of features) {
      await supabase
        .from('subscription_features')
        .upsert({
          ...feature,
          tier_id: params.id,
        });
    }

    router.push('/admin');
  }

  if (!tier) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Configure {tier.display_name} Tier
        </h1>

        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Display Name</label>
              <input
                type="text"
                value={tier.display_name}
                onChange={(e) => setTier({...tier, display_name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">Internal Name</label>
              <input
                type="text"
                value={tier.name}
                disabled
                className="w-full px-4 py-2 bg-gray-700 text-gray-500 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Monthly Price</label>
              <input
                type="number"
                value={tier.price_monthly}
                onChange={(e) => setTier({...tier, price_monthly: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Yearly Price</label>
              <input
                type="number"
                value={tier.price_yearly}
                onChange={(e) => setTier({...tier, price_yearly: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Stripe Price ID (Monthly)</label>
              <input
                type="text"
                value={tier.stripe_price_id || ''}
                onChange={(e) => setTier({...tier, stripe_price_id: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Color</label>
              <input
                type="text"
                value={tier.color}
                onChange={(e) => setTier({...tier, color: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-400 mb-2">Description</label>
            <textarea
              value={tier.description || ''}
              onChange={(e) => setTier({...tier, description: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg h-24"
            />
          </div>

          <div className="flex gap-4 mt-4">
            <label className="flex items-center text-gray-400">
              <input
                type="checkbox"
                checked={tier.is_active}
                onChange={(e) => setTier({...tier, is_active: e.target.checked})}
                className="mr-2"
              />
              Active
            </label>

            <label className="flex items-center text-gray-400">
              <input
                type="checkbox"
                checked={tier.is_recommended}
                onChange={(e) => setTier({...tier, is_recommended: e.target.checked})}
                className="mr-2"
              />
              Recommended
            </label>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usage Limits</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <LimitInput
              label="Oracle Chats"
              value={tier.oracle_chats_limit}
              onChange={(v) => setTier({...tier, oracle_chats_limit: v})}
            />
            <LimitInput
              label="Quick Scans"
              value={tier.quick_scans_limit}
              onChange={(v) => setTier({...tier, quick_scans_limit: v})}
            />
            <LimitInput
              label="Deep Dives"
              value={tier.deep_dives_limit}
              onChange={(v) => setTier({...tier, deep_dives_limit: v})}
            />
            <LimitInput
              label="Photo Analyses"
              value={tier.photo_analyses_limit}
              onChange={(v) => setTier({...tier, photo_analyses_limit: v})}
            />
            <LimitInput
              label="Report Generations"
              value={tier.report_generations_limit}
              onChange={(v) => setTier({...tier, report_generations_limit: v})}
            />
            <LimitInput
              label="API Calls"
              value={tier.api_calls_limit}
              onChange={(v) => setTier({...tier, api_calls_limit: v})}
            />
            <LimitInput
              label="Storage (GB)"
              value={tier.storage_limit_gb}
              onChange={(v) => setTier({...tier, storage_limit_gb: v})}
              step="0.1"
            />
          </div>
        </div>

        {/* Custom Features */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Custom Features</h2>
            <button
              onClick={() => setFeatures([...features, {
                feature_key: '',
                feature_name: '',
                feature_value: '',
                is_enabled: true,
              }])}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Feature
            </button>
          </div>

          {features.map((feature, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="Feature Key"
                value={feature.feature_key}
                onChange={(e) => {
                  const updated = [...features];
                  updated[index].feature_key = e.target.value;
                  setFeatures(updated);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
              <input
                type="text"
                placeholder="Feature Name"
                value={feature.feature_name}
                onChange={(e) => {
                  const updated = [...features];
                  updated[index].feature_name = e.target.value;
                  setFeatures(updated);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
              <input
                type="text"
                placeholder="Value"
                value={feature.feature_value}
                onChange={(e) => {
                  const updated = [...features];
                  updated[index].feature_value = e.target.value;
                  setFeatures(updated);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center text-gray-400">
                  <input
                    type="checkbox"
                    checked={feature.is_enabled}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[index].is_enabled = e.target.checked;
                      setFeatures(updated);
                    }}
                    className="mr-2"
                  />
                  Enabled
                </label>
                <button
                  onClick={() => {
                    setFeatures(features.filter((_, i) => i !== index));
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Save Changes
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function LimitInput({ label, value, onChange, step = "1" }: any) {
  const isUnlimited = value === -1;

  return (
    <div>
      <label className="block text-gray-400 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={isUnlimited ? '' : value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={isUnlimited}
          step={step}
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
        />
        <label className="flex items-center text-gray-400">
          <input
            type="checkbox"
            checked={isUnlimited}
            onChange={(e) => onChange(e.target.checked ? -1 : 0)}
            className="mr-2"
          />
          Unlimited
        </label>
      </div>
    </div>
  );
}
```

## Frontend Components

### Updated Subscription Card
```typescript
// src/components/profile/SubscriptionCard.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionCard() {
  const { subscription, tier, loading } = useSubscription();
  const [usage, setUsage] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subscription && tier) {
      fetchUsage();
    }
  }, [subscription, tier]);

  async function fetchUsage() {
    // Fetch usage data from API
    const response = await fetch('/api/usage');
    const data = await response.json();
    setUsage(data);
  }

  async function handleUpgrade() {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManageBilling() {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const usagePercentage = tier?.oracle_chats_limit > 0 
    ? (usage.oracle_chats_used / tier.oracle_chats_limit) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Subscription</h3>
        <span className={`px-3 py-1 text-xs font-medium rounded-full`}
          style={{
            backgroundColor: `${tier?.color}20`,
            borderColor: `${tier?.color}40`,
            color: tier?.color,
            borderWidth: '1px',
          }}
        >
          {tier?.display_name || 'Free'} Plan
        </span>
      </div>

      {/* Usage Stats */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm text-gray-400">Monthly Oracle Chats</p>
            <p className="text-2xl font-semibold text-white mt-1">
              {usage.oracle_chats_used || 0} 
              <span className="text-base text-gray-400">
                / {tier?.oracle_chats_limit === -1 ? '∞' : tier?.oracle_chats_limit || 5}
              </span>
            </p>
          </div>
          {tier?.oracle_chats_limit > 0 && (
            <p className="text-sm text-gray-400">{usagePercentage.toFixed(0)}% used</p>
          )}
        </div>
        
        {/* Progress Bar */}
        {tier?.oracle_chats_limit > 0 && (
          <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                usagePercentage > 80 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Feature Summary */}
      <div className="space-y-2 mb-6">
        <FeatureItem 
          label="Quick Scans" 
          value={tier?.quick_scans_limit === -1 ? 'Unlimited' : `${usage.quick_scans_used || 0}/${tier?.quick_scans_limit || 10}`} 
        />
        <FeatureItem 
          label="Deep Dives" 
          value={tier?.deep_dives_limit === -1 ? 'Unlimited' : `${usage.deep_dives_used || 0}/${tier?.deep_dives_limit || 1}`} 
        />
        <FeatureItem 
          label="Photo Analyses" 
          value={tier?.photo_analyses_limit === -1 ? 'Unlimited' : `${usage.photo_analyses_used || 0}/${tier?.photo_analyses_limit || 5}`} 
        />
      </div>

      {/* Billing Info */}
      {subscription && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Current plan</span>
            <span className="text-sm text-white">
              ${tier?.price_monthly}/month
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Next billing date</span>
            <span className="text-sm text-white">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
          </div>
          {subscription.cancel_at_period_end && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-sm text-orange-400">
                Cancels on {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {(!subscription || tier?.name === 'free') ? (
          <button 
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Upgrade Plan'}
          </button>
        ) : (
          <>
            {tier?.name !== 'enterprise' && (
              <button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Upgrade Plan'}
              </button>
            )}
            <button 
              onClick={handleManageBilling}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
```

## Webhook Handling

### Database Function for Usage Tracking
```sql
-- Create function to increment usage
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

-- Create function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_tier RECORD;
  v_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get active subscription
  SELECT s.*, t.*
  INTO v_subscription
  FROM subscriptions s
  JOIN pricing_tiers t ON s.tier_id = t.id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  LIMIT 1;

  -- If no subscription, check free tier
  IF NOT FOUND THEN
    SELECT * INTO v_tier
    FROM pricing_tiers
    WHERE name = 'free';
    
    -- Get usage for free tier
    SELECT COALESCE(SUM(usage_count), 0) INTO v_usage
    FROM usage_tracking
    WHERE user_id = p_user_id
      AND feature_key = p_feature_key
      AND period_start >= DATE_TRUNC('month', CURRENT_DATE);
    
    v_limit := CASE p_feature_key
      WHEN 'oracle_chats' THEN v_tier.oracle_chats_limit
      WHEN 'quick_scans' THEN v_tier.quick_scans_limit
      WHEN 'deep_dives' THEN v_tier.deep_dives_limit
      WHEN 'photo_analyses' THEN v_tier.photo_analyses_limit
      ELSE 0
    END;
  ELSE
    -- Get usage for subscription
    SELECT COALESCE(SUM(usage_count), 0) INTO v_usage
    FROM usage_tracking
    WHERE subscription_id = v_subscription.id
      AND feature_key = p_feature_key
      AND period_start >= v_subscription.current_period_start
      AND period_end <= v_subscription.current_period_end;
    
    v_limit := CASE p_feature_key
      WHEN 'oracle_chats' THEN v_subscription.oracle_chats_limit
      WHEN 'quick_scans' THEN v_subscription.quick_scans_limit
      WHEN 'deep_dives' THEN v_subscription.deep_dives_limit
      WHEN 'photo_analyses' THEN v_subscription.photo_analyses_limit
      ELSE 0
    END;
  END IF;

  -- Check if unlimited (-1) or under limit
  RETURN v_limit = -1 OR v_usage < v_limit;
END;
$$ LANGUAGE plpgsql;
```

## Testing Strategy

### 1. Test Stripe Integration
```javascript
// test-stripe-integration.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeSetup() {
  try {
    // Test creating a product
    const product = await stripe.products.create({
      name: 'Proxima Pro',
      description: 'Pro subscription for Proxima Health',
    });
    console.log('Product created:', product.id);

    // Test creating prices
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 1999, // $19.99
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log('Monthly price created:', monthlyPrice.id);

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 19999, // $199.99
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    console.log('Yearly price created:', yearlyPrice.id);

    // Test webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: 'https://your-domain.com/api/stripe/webhook',
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
      ],
    });
    console.log('Webhook endpoint created:', webhookEndpoint.id);
    console.log('Webhook secret:', webhookEndpoint.secret);

  } catch (error) {
    console.error('Error:', error);
  }
}

testStripeSetup();
```

### 2. Test Usage Tracking
```typescript
// src/app/api/test-usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const userId = 'test-user-id';
  
  // Test incrementing usage
  await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_subscription_id: null,
    p_feature_key: 'oracle_chats',
    p_period_start: new Date().toISOString(),
    p_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Test checking access
  const { data: hasAccess } = await supabase.rpc('check_feature_access', {
    p_user_id: userId,
    p_feature_key: 'oracle_chats',
  });

  return NextResponse.json({ hasAccess });
}
```

## Required Accounts & Services

### Services You Need to Sign Up For:

1. **Stripe (Payment Processing)**
   - Website: https://stripe.com
   - Purpose: Process payments, manage subscriptions
   - Cost: 2.9% + 30¢ per transaction
   - Required for: All payment functionality

2. **Supabase (Already have)**
   - Your existing database
   - Will store subscription data
   - Already configured

3. **Domain & Hosting (If not already set up)**
   - Vercel: https://vercel.com (recommended for Next.js)
   - Custom domain (for production)
   - SSL certificate (usually included)

4. **Optional but Recommended:**
   - **Sentry**: https://sentry.io (error tracking)
   - **PostHog**: https://posthog.com (analytics)
   - **Crisp/Intercom**: Customer support chat
   - **SendGrid/Resend**: Transactional emails

## Step-by-Step Setup Guide

### Step 1: Create Stripe Account
1. **Sign up at Stripe**
   - Go to https://stripe.com
   - Click "Start now" or "Sign up"
   - Enter your email and create password
   - Verify your email address

2. **Complete Business Profile**
   - Business name: Proxima Health (or your company name)
   - Business type: Healthcare/Technology
   - Country: Your country
   - Business address
   - Business website: https://proxima-health.com (or your domain)

3. **Verify Your Identity**
   - Personal information (name, DOB, SSN/EIN)
   - Bank account details for payouts
   - Tax information
   - Business documentation if required

### Step 2: Get Your API Keys
1. **Navigate to Developers Section**
   - Login to Stripe Dashboard
   - Click "Developers" in the left sidebar
   - Click "API keys" tab

2. **Copy Your Keys**
   ```
   Test Mode Keys (for development):
   - Publishable key: pk_test_... (safe for frontend)
   - Secret key: sk_test_... (backend only!)
   
   Live Mode Keys (for production):
   - Publishable key: pk_live_...
   - Secret key: sk_live_...
   ```

3. **Save to .env.local**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51O...
   STRIPE_SECRET_KEY=sk_test_51O...
   ```

### Step 3: Create Products and Prices in Stripe

1. **Navigate to Products**
   - In Stripe Dashboard, go to "Products"
   - Click "Add product"

2. **Create Each Tier Product**

   **Basic Tier:**
   - Name: "Proxima Basic"
   - Description: "Basic health intelligence subscription"
   - Click "Add product"
   - Add pricing:
     - Monthly: $5.00, recurring
     - Yearly: $50.00, recurring
   - Copy the price IDs (price_...)

   **Pro Tier:**
   - Name: "Proxima Pro"
   - Description: "Professional health intelligence subscription"
   - Add pricing:
     - Monthly: $20.00, recurring
     - Yearly: $200.00, recurring
   - Copy the price IDs

   **Pro+ Tier:**
   - Name: "Proxima Pro Plus"
   - Description: "Premium health intelligence subscription"
   - Add pricing:
     - Monthly: $50.00, recurring
     - Yearly: $500.00, recurring
   - Copy the price IDs

   **Enterprise Tier:**
   - Name: "Proxima Enterprise"
   - Description: "Enterprise health intelligence solution"
   - Don't add pricing (handle manually)

3. **Save Price IDs to .env.local**
   ```env
   STRIPE_PRICE_BASIC_MONTHLY=price_1O...
   STRIPE_PRICE_BASIC_YEARLY=price_1O...
   STRIPE_PRICE_PRO_MONTHLY=price_1O...
   STRIPE_PRICE_PRO_YEARLY=price_1O...
   STRIPE_PRICE_PRO_PLUS_MONTHLY=price_1O...
   STRIPE_PRICE_PRO_PLUS_YEARLY=price_1O...
   ```

### Step 4: Configure Webhooks

1. **Create Webhook Endpoint**
   - In Stripe Dashboard, go to "Developers" → "Webhooks"
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`

2. **Get Webhook Secret**
   - After creating, click on the webhook
   - Copy the "Signing secret" (whsec_...)
   - Add to .env.local:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 5: Configure Customer Portal

1. **Enable Customer Portal**
   - Go to "Settings" → "Billing" → "Customer portal"
   - Click "Enable customer portal"

2. **Configure Portal Settings**
   - **Features:**
     - ✅ Allow customers to update payment methods
     - ✅ Allow customers to update billing addresses
     - ✅ Allow customers to view billing history
     - ✅ Allow customers to download invoices
   
   - **Subscriptions:**
     - ✅ Cancel subscriptions
     - ✅ Switch plans (choose allowed products)
     - ✅ Update quantities (if applicable)
   
   - **Business Information:**
     - Add your business name
     - Add support email
     - Add support phone (optional)
     - Add privacy policy URL
     - Add terms of service URL

3. **Customize Appearance**
   - Upload logo
   - Set brand colors
   - Customize button text

### Step 6: Set Up Supabase Database

1. **Run Migration Scripts**
   ```sql
   -- Run these in Supabase SQL editor in order:
   
   -- 1. Create subscriptions table
   CREATE TABLE subscriptions (...);
   
   -- 2. Create pricing_tiers table  
   CREATE TABLE pricing_tiers (...);
   
   -- 3. Create subscription_features table
   CREATE TABLE subscription_features (...);
   
   -- 4. Create usage_tracking table
   CREATE TABLE usage_tracking (...);
   
   -- 5. Add stripe_customer_id to users
   ALTER TABLE auth.users ADD COLUMN stripe_customer_id TEXT UNIQUE;
   ```

2. **Create Database Functions**
   ```sql
   -- Create increment_usage function
   CREATE OR REPLACE FUNCTION increment_usage(...);
   
   -- Create check_feature_access function
   CREATE OR REPLACE FUNCTION check_feature_access(...);
   ```

3. **Set Up Row Level Security (RLS)**
   ```sql
   -- Enable RLS on tables
   ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view own subscription"
   ON subscriptions FOR SELECT
   USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can view all tiers"
   ON pricing_tiers FOR SELECT
   TO authenticated
   USING (true);
   ```

### Step 7: Test in Development

1. **Use Stripe Test Cards**
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   Requires Auth: 4000 0025 0000 3155
   ```

2. **Test Webhook Locally**
   ```bash
   # Install Stripe CLI
   # Windows (using Scoop)
   scoop install stripe
   
   # Mac
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to localhost
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   
   # Copy the webhook signing secret it provides
   ```

3. **Test Full Flow**
   - Create account
   - Subscribe to plan
   - Check database for subscription record
   - Access customer portal
   - Cancel subscription
   - Check webhook handling

### Step 8: Configure for Production

1. **Switch to Live Mode**
   - Update .env.production with live keys
   - Update webhook endpoint to production URL
   - Ensure database migrations are run on production

2. **Security Checklist**
   - [ ] Never expose secret keys in frontend code
   - [ ] Use environment variables for all keys
   - [ ] Verify webhook signatures
   - [ ] Use HTTPS for all endpoints
   - [ ] Enable Stripe Radar for fraud protection

3. **Compliance**
   - [ ] Add Terms of Service page
   - [ ] Add Privacy Policy page
   - [ ] Add Refund Policy
   - [ ] Ensure GDPR compliance if in EU
   - [ ] Set up proper tax handling (Stripe Tax if needed)

### Step 9: Monitor and Maintain

1. **Set Up Monitoring**
   - Stripe Dashboard for payment metrics
   - Webhook logs for failures
   - Customer support email for issues
   - Error tracking (Sentry, etc.)

2. **Regular Tasks**
   - Review failed payments
   - Handle customer support requests
   - Monitor subscription churn
   - Update pricing as needed

## Quick Start Commands

Once you have your Stripe account set up, here are the commands to get started:

```bash
# 1. Install dependencies
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# 2. Create .env.local file with your keys
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." >> .env.local
echo "STRIPE_SECRET_KEY=sk_test_..." >> .env.local
echo "STRIPE_WEBHOOK_SECRET=whsec_..." >> .env.local

# 3. Install Stripe CLI for local testing (optional but recommended)
# Mac
brew install stripe/stripe-cli/stripe

# Windows (with Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# 4. Test webhook forwarding locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 5. Run your app
npm run dev
```

## Common Issues & Solutions

### Issue: "No such price: price_..."
**Solution:** Make sure you've created the products and prices in your Stripe dashboard and copied the correct price IDs to your .env file.

### Issue: Webhook signature verification failed
**Solution:** 
- Ensure you're using the correct webhook secret
- Make sure you're passing the raw request body (not parsed JSON)
- Check that your webhook endpoint URL matches exactly

### Issue: Customer portal not working
**Solution:**
- Enable customer portal in Stripe Dashboard → Settings → Billing → Customer portal
- Configure allowed actions (cancel, switch plans, etc.)

### Issue: Subscription not showing in database
**Solution:**
- Check webhook logs in Stripe Dashboard
- Verify database connection and permissions
- Ensure RLS policies allow insert/update operations

## Estimated Timeline

### Realistic One-Day Implementation (8-10 hours)

**YES, it's possible to get this working in one day!** Here's how:

#### Morning (2-3 hours): Setup & Configuration
**9:00 AM - 10:00 AM**: Stripe Account Setup
- Create Stripe account (15 min)
- Verify identity/business info (15 min)
- Create products and prices (20 min)
- Configure webhooks (10 min)

**10:00 AM - 11:00 AM**: Database Setup
- Run SQL migrations in Supabase (20 min)
- Create database functions (20 min)
- Set up RLS policies (20 min)

**11:00 AM - 12:00 PM**: Environment Configuration
- Install npm packages (5 min)
- Set up .env.local with keys (10 min)
- Configure customer portal (15 min)
- Test Stripe CLI locally (30 min)

#### Afternoon (3-4 hours): Implementation
**1:00 PM - 2:30 PM**: Backend Implementation
- Create checkout session API route (30 min)
- Set up webhook handler (30 min)
- Create portal session API route (20 min)
- Test with Stripe CLI (10 min)

**2:30 PM - 4:00 PM**: Frontend Integration
- Update SubscriptionCard component (30 min)
- Add checkout flow (30 min)
- Integrate useSubscription hook (20 min)
- Connect customer portal (10 min)

**4:00 PM - 5:00 PM**: Testing
- Test checkout with test card (15 min)
- Test subscription creation (15 min)
- Test customer portal (15 min)
- Verify database updates (15 min)

#### Evening (1-2 hours): Polish & Deploy
**5:00 PM - 6:00 PM**: Final Touches
- Add error handling (20 min)
- Test edge cases (20 min)
- Quick UI polish (20 min)

**6:00 PM - 7:00 PM**: Production Ready (Optional)
- Switch to live keys (10 min)
- Deploy to Vercel/production (20 min)
- Final production test (30 min)

### What You Can Skip for Day 1:
- Admin console (can add later)
- Complex tier restrictions (already set to unlimited)
- Usage tracking analytics
- Advanced error monitoring
- Email notifications
- Team accounts feature

### Minimum Viable Implementation Checklist:
- [x] Users can subscribe to a plan
- [x] Users can manage billing via portal
- [x] Subscriptions sync to database
- [x] Basic tier display in UI
- [x] Webhook handling for subscription changes

### Tips for One-Day Success:
1. **Use the provided code as-is** - Don't customize yet
2. **Focus on happy path** - Handle edge cases later
3. **Test with Stripe test mode** - Don't worry about live mode yet
4. **Skip the admin console** - Use Stripe Dashboard directly
5. **Use simple UI** - Polish can come later

### If You Hit Issues:
- Stripe account verification can take time (do this first!)
- Use test mode all day (live mode can wait)
- Skip complex features, get basic flow working
- Use the Quick Start Commands section
- Reference Common Issues & Solutions

**Bottom line: With focused effort and using the provided code, you can absolutely get Stripe payments working in one day!**

## Deployment Checklist

### Prerequisites
- [ ] Create Stripe account and get API keys
- [ ] Set up Stripe products and prices
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set up environment variables
- [ ] Run database migrations

### Database Setup
1. Run all SQL migrations in order
2. Insert default pricing tiers
3. Create database functions
4. Set up RLS policies

### Stripe Configuration
1. Create products for each tier
2. Create prices (monthly and yearly)
3. Configure customer portal
4. Set up webhook endpoint
5. Test webhook signature

### Frontend Setup
1. Install Stripe dependencies
2. Configure Stripe provider
3. Update subscription components
4. Add feature gates
5. Test checkout flow

### Admin Console
1. Set up admin authentication
2. Deploy admin pages
3. Configure tier management
4. Test feature configuration

### Testing
1. Test checkout flow
2. Test subscription upgrades/downgrades
3. Test cancellations
4. Test webhook handling
5. Test usage tracking
6. Test feature gating

## Security Considerations

1. **API Key Security**
   - Store Stripe keys in environment variables
   - Never expose secret keys to frontend
   - Use webhook signatures for verification

2. **Database Security**
   - Implement RLS policies for subscription data
   - Use service role key only for webhooks
   - Audit subscription changes

3. **Payment Security**
   - Use Stripe's hosted checkout
   - Never store card details
   - Implement proper error handling

4. **Admin Access**
   - Implement role-based access control
   - Audit admin actions
   - Secure admin routes

## Support & Maintenance

### Monitoring
- Track subscription metrics
- Monitor failed payments
- Alert on high churn rates
- Track feature usage

### Customer Support
- Provide self-service portal
- Handle refund requests
- Support subscription issues
- Track support tickets

### Updates
- Keep Stripe SDK updated
- Monitor API deprecations
- Update pricing as needed
- Add new features/tiers

---

This implementation plan provides a complete foundation for integrating Stripe payments and membership tiers into Proxima-1. The system is designed to be scalable, maintainable, and user-friendly while providing powerful admin controls for managing subscriptions and features.