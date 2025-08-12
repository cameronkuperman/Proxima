import Stripe from 'stripe';

// Lazy initialize Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

export const stripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    });
  }
  return stripeInstance;
};

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