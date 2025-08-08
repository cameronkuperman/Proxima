// Stripe configuration for server-side
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
  appInfo: {
    name: 'Proxima Health',
    version: '1.0.0',
  },
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Payment methods to accept
  paymentMethods: ['card', 'paypal', 'link'],
  
  // Supported currencies (Stripe will auto-convert)
  supportedCurrencies: ['usd', 'eur', 'gbp', 'cad', 'aud'],
  
  // Default currency
  defaultCurrency: 'usd',
  
  // Enable automatic tax calculation
  automaticTax: true,
  
  // Customer portal configuration
  customerPortalConfig: {
    features: {
      customer_update: {
        allowed_updates: ['email', 'address', 'phone', 'tax_id'],
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end' as const,
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive',
            'missing_features',
            'switched_service',
            'unused',
            'other',
          ],
        },
      },
      subscription_pause: {
        enabled: false, // Can enable later
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price', 'quantity'],
        proration_behavior: 'create_prorations' as const,
      },
    },
  },
  
  // Webhook events to listen for
  webhookEvents: [
    'checkout.session.completed',
    'checkout.session.expired',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'invoice.upcoming',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.updated',
    'price.created',
    'price.updated',
  ],
};

// Helper function to format currency
export function formatCurrency(
  amount: number,
  currency: string = 'usd'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper function to get Stripe price ID based on tier and billing cycle
export function getStripePriceId(
  tier: string,
  billingCycle: 'monthly' | 'yearly'
): string | null {
  const priceMap: Record<string, string | undefined> = {
    'basic_monthly': process.env.STRIPE_PRICE_BASIC_MONTHLY,
    'basic_yearly': process.env.STRIPE_PRICE_BASIC_YEARLY,
    'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
    'pro_yearly': process.env.STRIPE_PRICE_PRO_YEARLY,
    'pro_plus_monthly': process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY,
    'pro_plus_yearly': process.env.STRIPE_PRICE_PRO_PLUS_YEARLY,
  };
  
  const key = `${tier}_${billingCycle}`;
  return priceMap[key] || null;
}