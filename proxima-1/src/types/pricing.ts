// Pricing Types - UI Only (No Stripe Integration)

export interface PricingTier {
  name: string;
  displayName: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  color: string;
  isRecommended?: boolean;
  features: {
    oracleChats: number;
    quickScans: number;
    deepDives: number;
    photoAnalyses: number;
    reportGenerations: number;
    storageGB: number;
    prioritySupport: boolean;
    teamAccounts?: boolean;
    customBranding?: boolean;
  };
  perks: string[];
}

export const TIERS: Record<string, PricingTier> = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
    },
    color: '#6b7280',
    features: {
      oracleChats: 5,
      quickScans: 10,
      deepDives: 1,
      photoAnalyses: 5,
      reportGenerations: 2,
      storageGB: 1,
      prioritySupport: false,
    },
    perks: [
      'Basic health insights',
      'Limited AI analyses',
      'Community support',
    ],
  },
  basic: {
    name: 'basic',
    displayName: 'Basic',
    price: {
      monthly: 5,
      yearly: 50,
    },
    color: '#3b82f6',
    features: {
      oracleChats: 20,
      quickScans: 50,
      deepDives: 5,
      photoAnalyses: 20,
      reportGenerations: 10,
      storageGB: 5,
      prioritySupport: false,
    },
    perks: [
      'Enhanced AI models',
      'Extended history',
      'Email support',
    ],
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    price: {
      monthly: 20,
      yearly: 200,
    },
    color: '#8b5cf6',
    isRecommended: true,
    features: {
      oracleChats: 100,
      quickScans: 200,
      deepDives: 20,
      photoAnalyses: 100,
      reportGenerations: 50,
      storageGB: 20,
      prioritySupport: true,
    },
    perks: [
      'Advanced AI reasoning',
      'Priority processing',
      'Expert medical insights',
      'Phone support',
    ],
  },
  pro_plus: {
    name: 'pro_plus',
    displayName: 'Pro+',
    price: {
      monthly: 50,
      yearly: 500,
    },
    color: '#ec4899',
    features: {
      oracleChats: -1, // Unlimited
      quickScans: -1,
      deepDives: -1,
      photoAnalyses: -1,
      reportGenerations: -1,
      storageGB: 100,
      prioritySupport: true,
    },
    perks: [
      'Unlimited everything',
      'Fastest AI models',
      'White-glove support',
      'Early access to features',
    ],
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: {
      monthly: null,
      yearly: null,
    },
    color: '#dc2626',
    features: {
      oracleChats: -1,
      quickScans: -1,
      deepDives: -1,
      photoAnalyses: -1,
      reportGenerations: -1,
      storageGB: -1,
      prioritySupport: true,
      teamAccounts: true,
      customBranding: true,
    },
    perks: [
      'Custom deployment',
      'HIPAA compliance',
      'Dedicated support team',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
};

export function formatFeatureLimit(limit: number): string {
  if (limit === -1) return 'Unlimited';
  if (limit === 0) return '—';
  return limit.toString();
}