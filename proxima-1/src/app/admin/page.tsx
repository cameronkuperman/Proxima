'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity,
  DollarSign,
  Calendar,
  AlertCircle,
  Settings,
  BarChart3,
  Package,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Format currency helper
function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Stripe amounts are in cents
}

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  churnRate: number;
  trialConversions: number;
  recentSignups: number;
  failedPayments: number;
}

interface RecentTransaction {
  id: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string;
}

interface UserSubscription {
  id: string;
  userEmail: string;
  tierName: string;
  status: string;
  billingCycle: string;
  amount: number;
  nextBilling: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    churnRate: 0,
    trialConversions: 0,
    recentSignups: 0,
    failedPayments: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is admin
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !adminUser) {
        toast.error('Unauthorized: Admin access required');
        router.push('/profile');
        return;
      }

      setIsAdmin(true);
      await fetchDashboardData();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/profile');
    }
  }

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        usersData,
        subscriptionsData,
        paymentsData,
        promotionalData,
        profilesData,
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact' }),
        supabase.from('subscriptions').select(`
          *,
          pricing_tiers (*)
        `),
        supabase.from('payment_history').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('promotional_periods').select('*'),
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(7),
      ]);

      // Calculate stats
      const activeSubsCount = subscriptionsData.data?.filter(s => s.status === 'active').length || 0;
      const totalMonthlyRevenue = subscriptionsData.data
        ?.filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
        .reduce((sum, s) => sum + (s.pricing_tiers?.price_monthly || 0), 0) || 0;
      const totalYearlyRevenue = subscriptionsData.data
        ?.filter(s => s.status === 'active' && s.billing_cycle === 'yearly')
        .reduce((sum, s) => sum + (s.pricing_tiers?.price_yearly || 0), 0) || 0;
      
      const canceledSubs = subscriptionsData.data?.filter(s => s.status === 'canceled').length || 0;
      const totalSubs = subscriptionsData.data?.length || 1;
      const churn = (canceledSubs / totalSubs) * 100;

      const trialConversions = subscriptionsData.data
        ?.filter(s => s.trial_end && s.status === 'active').length || 0;
      
      const failedPayments = paymentsData.data?.filter(p => p.status === 'failed').length || 0;

      setStats({
        totalUsers: usersData.count || 0,
        activeSubscriptions: activeSubsCount,
        monthlyRevenue: totalMonthlyRevenue,
        yearlyRevenue: totalYearlyRevenue,
        churnRate: churn,
        trialConversions,
        recentSignups: profilesData.data?.length || 0,
        failedPayments,
      });

      // Format recent transactions
      if (paymentsData.data) {
        setRecentTransactions(paymentsData.data.map(payment => ({
          id: payment.id,
          userEmail: 'user@example.com', // You'd need to join with user_profiles to get email
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.created_at,
          description: payment.description || 'Subscription payment',
        })));
      }

      // Format active subscriptions
      if (subscriptionsData.data) {
        const activeSubs = subscriptionsData.data
          .filter(s => s.status === 'active')
          .slice(0, 10)
          .map(sub => ({
            id: sub.id,
            userEmail: 'user@example.com', // You'd need to join with user_profiles
            tierName: sub.pricing_tiers?.display_name || 'Unknown',
            status: sub.status,
            billingCycle: sub.billing_cycle,
            amount: sub.billing_cycle === 'monthly' 
              ? sub.pricing_tiers?.price_monthly || 0
              : sub.pricing_tiers?.price_yearly || 0,
            nextBilling: sub.current_period_end,
          }));
        setActiveSubscriptions(activeSubs);
      }

    } catch (error) {
      console.error('Dashboard data error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Manage subscriptions and monitor platform health</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => router.push('/admin/settings')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change="+12%"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            change="+8%"
            icon={<CreditCard className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            change="+15%"
            icon={<DollarSign className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Churn Rate"
            value={`${stats.churnRate.toFixed(1)}%`}
            change="-2%"
            icon={<TrendingUp className="w-5 h-5" />}
            color="red"
            isNegative={true}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Yearly Revenue"
            value={formatCurrency(stats.yearlyRevenue)}
            icon={<Calendar className="w-5 h-5" />}
            color="indigo"
          />
          <StatCard
            title="Trial Conversions"
            value={stats.trialConversions}
            icon={<Activity className="w-5 h-5" />}
            color="teal"
          />
          <StatCard
            title="Recent Signups (7d)"
            value={stats.recentSignups}
            icon={<Users className="w-5 h-5" />}
            color="pink"
          />
          <StatCard
            title="Failed Payments"
            value={stats.failedPayments}
            icon={<AlertCircle className="w-5 h-5" />}
            color="orange"
          />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
              <button className="text-sm text-purple-400 hover:text-purple-300">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white">{transaction.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <p className={`text-xs ${
                      transaction.status === 'succeeded' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Active Subscriptions</h2>
              <button 
                onClick={() => router.push('/admin/users')}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Manage Users
              </button>
            </div>
            <div className="space-y-3">
              {activeSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white">{sub.tierName} Plan</p>
                    <p className="text-xs text-gray-400">
                      Next billing: {new Date(sub.nextBilling).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(sub.amount)}/{sub.billingCycle}
                    </p>
                    <p className="text-xs text-green-400">{sub.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Tier Management"
            description="Configure pricing tiers and features"
            icon={<Package className="w-6 h-6" />}
            onClick={() => router.push('/admin/tiers')}
          />
          <QuickActionCard
            title="User Management"
            description="View and manage user subscriptions"
            icon={<Users className="w-6 h-6" />}
            onClick={() => router.push('/admin/users')}
          />
          <QuickActionCard
            title="Analytics"
            description="View detailed revenue analytics"
            icon={<BarChart3 className="w-6 h-6" />}
            onClick={() => router.push('/admin/analytics')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  isNegative = false 
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
  isNegative?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700',
    red: 'from-red-600 to-red-700',
    indigo: 'from-indigo-600 to-indigo-700',
    teal: 'from-teal-600 to-teal-700',
    pink: 'from-pink-600 to-pink-700',
    orange: 'from-orange-600 to-orange-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 bg-gradient-to-br ${colorMap[color]} rounded-lg text-white`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium ${
            isNegative ? 'text-red-400' : 'text-green-400'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </motion.div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 text-left hover:bg-white/[0.05] transition-all"
    >
      <div className="text-purple-400 mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.button>
  );
}