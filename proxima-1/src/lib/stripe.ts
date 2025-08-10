import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Price configuration mapping
export const PRICE_IDS = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY!,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  pro_plus: {
    monthly: process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_PLUS_YEARLY!,
  },
} as const;

// Helper to get price ID
export function getPriceId(tier: string, billingCycle: 'monthly' | 'yearly'): string | null {
  const tierPrices = PRICE_IDS[tier as keyof typeof PRICE_IDS];
  if (!tierPrices) return null;
  return tierPrices[billingCycle];
}