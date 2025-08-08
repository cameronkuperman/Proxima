// Subscription and tier types

export interface Tier {
  id: string;
  name: 'free' | 'basic' | 'pro' | 'pro_plus' | 'enterprise';
  displayName: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  features: {
    oracleChats: number | 'unlimited';
    quickScans: number | 'unlimited';
    deepDives: number | 'unlimited';
    photoAnalyses: number | 'unlimited';
    reportGenerations: number | 'unlimited';
    apiCalls: number | 'unlimited';
    storageGB: number | 'unlimited';
    // Feature flags
    prioritySupport: boolean;
    customBranding: boolean;
    teamAccounts: boolean;
    advancedAnalytics: boolean;
    exportFormats: string[];
  };
  perks: string[];
  color: string;
  isRecommended: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  tierId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  billingCycle: 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionalPeriod {
  id: string;
  userId: string;
  tierId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageCount: number;
  daysRemaining?: number;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UsageTracking {
  feature: string;
  used: number;
  limit: number | 'unlimited';
  percentage?: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  email: string;
  fullName?: string;
  isAdmin: boolean;
  promotionalPeriod?: PromotionalPeriod;
  subscription?: Subscription;
  tier?: Tier;
}

// Tier definitions with actual limits
export const TIERS: Record<string, Tier> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: { monthly: 0, yearly: 0 },
    features: {
      oracleChats: 5,
      quickScans: 10,
      deepDives: 1,
      photoAnalyses: 5,
      reportGenerations: 2,
      apiCalls: 100,
      storageGB: 1,
      prioritySupport: false,
      customBranding: false,
      teamAccounts: false,
      advancedAnalytics: false,
      exportFormats: ['pdf'],
    },
    perks: [
      'Basic health insights',
      'Limited AI consultations',
      'Standard response time',
    ],
    color: '#6b7280',
    isRecommended: false,
  },
  basic: {
    id: 'basic',
    name: 'basic',
    displayName: 'Basic',
    price: { monthly: 5.00, yearly: 50.00 },
    features: {
      oracleChats: 20,
      quickScans: 50,
      deepDives: 5,
      photoAnalyses: 20,
      reportGenerations: 10,
      apiCalls: 500,
      storageGB: 5,
      prioritySupport: false,
      customBranding: false,
      teamAccounts: false,
      advancedAnalytics: false,
      exportFormats: ['pdf', 'csv'],
    },
    perks: [
      'Everything in Free',
      '4x more AI consultations',
      'Export to CSV',
      'Email support',
    ],
    color: '#3b82f6',
    isRecommended: false,
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: { monthly: 20.00, yearly: 200.00 },
    features: {
      oracleChats: 100,
      quickScans: 200,
      deepDives: 20,
      photoAnalyses: 100,
      reportGenerations: 50,
      apiCalls: 2000,
      storageGB: 20,
      prioritySupport: true,
      customBranding: false,
      teamAccounts: false,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json'],
    },
    perks: [
      'Everything in Basic',
      'Priority support',
      'Advanced analytics',
      'JSON export',
      'Faster AI responses',
    ],
    color: '#8b5cf6',
    isRecommended: true,
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'pro_plus',
    displayName: 'Pro+',
    price: { monthly: 50.00, yearly: 500.00 },
    features: {
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 10000,
      storageGB: 100,
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json', 'xml'],
    },
    perks: [
      'Everything in Pro',
      'Unlimited AI features',
      'Custom branding',
      'Team accounts (up to 5)',
      'API access',
      'Dedicated support',
    ],
    color: '#ec4899',
    isRecommended: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    price: { monthly: null, yearly: null }, // Custom pricing
    features: {
      oracleChats: 'unlimited',
      quickScans: 'unlimited',
      deepDives: 'unlimited',
      photoAnalyses: 'unlimited',
      reportGenerations: 'unlimited',
      apiCalls: 'unlimited',
      storageGB: 'unlimited',
      prioritySupport: true,
      customBranding: true,
      teamAccounts: true,
      advancedAnalytics: true,
      exportFormats: ['pdf', 'csv', 'json', 'xml', 'hl7'],
    },
    perks: [
      'Everything in Pro+',
      'Unlimited everything',
      'White-label solution',
      'Unlimited team members',
      'SLA guarantee',
      'Custom integrations',
      'Dedicated account manager',
      'HIPAA compliance support',
    ],
    color: '#dc2626',
    isRecommended: false,
  },
};

// Helper function to check if a value is unlimited
export function isUnlimited(value: number | 'unlimited'): boolean {
  return value === 'unlimited' || value === -1;
}

// Helper function to format feature limit
export function formatFeatureLimit(value: number | 'unlimited'): string {
  if (isUnlimited(value)) return 'Unlimited';
  return value.toLocaleString();
}

// Helper function to get tier by name
export function getTierByName(name: string): Tier | undefined {
  return TIERS[name];
}

// Helper function to calculate usage percentage
export function calculateUsagePercentage(used: number, limit: number | 'unlimited'): number {
  if (isUnlimited(limit)) return 0;
  if (typeof limit === 'number' && limit > 0) {
    return Math.min(100, (used / limit) * 100);
  }
  return 0;
}