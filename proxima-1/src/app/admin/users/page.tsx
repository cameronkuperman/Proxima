'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter,
  Download,
  MoreVertical,
  User,
  Mail,
  Calendar,
  CreditCard,
  Shield,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  subscription?: {
    tier: string;
    status: string;
    billingCycle: string;
    nextBilling: string;
  };
  promotionalPeriod?: {
    active: boolean;
    daysRemaining: number;
  };
  isAdmin: boolean;
  totalSpent: number;
  lastActive?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterUserList();
  }, [searchTerm, filterStatus, users]);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

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
      await fetchUsers();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/profile');
    }
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      // Fetch all user data with related information
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          *,
          pricing_tiers (*)
        `);

      const { data: promotionalPeriods } = await supabase
        .from('promotional_periods')
        .select('*')
        .eq('is_active', true);

      const { data: paymentHistory } = await supabase
        .from('payment_history')
        .select('*');

      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('*');

      // Combine all data
      const userData: UserData[] = profiles?.map(profile => {
        const userSub = subscriptions?.find(s => s.user_id === profile.user_id && s.status === 'active');
        const userPromo = promotionalPeriods?.find(p => p.user_id === profile.user_id);
        const userPayments = paymentHistory?.filter(p => p.user_id === profile.user_id) || [];
        const isUserAdmin = adminUsers?.some(a => a.user_id === profile.user_id) || false;
        
        const totalSpent = userPayments
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const daysRemaining = userPromo 
          ? Math.ceil((new Date(userPromo.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: profile.user_id,
          email: profile.email || 'N/A',
          fullName: profile.full_name,
          createdAt: profile.created_at,
          subscription: userSub ? {
            tier: userSub.pricing_tiers?.display_name || 'Unknown',
            status: userSub.status,
            billingCycle: userSub.billing_cycle,
            nextBilling: userSub.current_period_end,
          } : undefined,
          promotionalPeriod: userPromo ? {
            active: true,
            daysRemaining,
          } : undefined,
          isAdmin: isUserAdmin,
          totalSpent,
        };
      }) || [];

      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function filterUserList() {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'subscribed':
            return user.subscription && user.subscription.status === 'active';
          case 'trial':
            return user.promotionalPeriod?.active;
          case 'free':
            return !user.subscription && !user.promotionalPeriod?.active;
          case 'admin':
            return user.isAdmin;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }

  async function handleMakeAdmin(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user email
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          email: targetUser.email,
          role: 'admin',
        });

      if (error) throw error;

      toast.success('User granted admin access');
      await fetchUsers();
    } catch (error) {
      console.error('Error making admin:', error);
      toast.error('Failed to grant admin access');
    }
  }

  async function handleRemoveAdmin(userId: string) {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Admin access revoked');
      await fetchUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to revoke admin access');
    }
  }

  async function handleCancelSubscription(userId: string) {
    // This would call Stripe API to cancel subscription
    toast.info('Subscription cancellation would be processed through Stripe');
  }

  async function handleExportUsers() {
    // Convert users to CSV
    const csv = [
      ['Email', 'Name', 'Tier', 'Status', 'Total Spent', 'Created At'],
      ...filteredUsers.map(u => [
        u.email,
        u.fullName || '',
        u.subscription?.tier || 'Free',
        u.subscription?.status || 'No subscription',
        `$${u.totalSpent.toFixed(2)}`,
        new Date(u.createdAt).toLocaleDateString(),
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading users...</div>
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
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-sm text-gray-400 mt-1">
                {filteredUsers.length} of {users.length} users
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportUsers}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Users</option>
              <option value="subscribed">Subscribed</option>
              <option value="trial">Promotional</option>
              <option value="free">Free</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.fullName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.subscription ? (
                        <div>
                          <div className="text-sm text-white">{user.subscription.tier}</div>
                          <div className="text-xs text-gray-400">
                            {user.subscription.billingCycle}
                          </div>
                        </div>
                      ) : user.promotionalPeriod?.active ? (
                        <div>
                          <div className="text-sm text-purple-400">Pro (Promotional)</div>
                          <div className="text-xs text-gray-400">
                            {user.promotionalPeriod.daysRemaining} days left
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">${user.totalSpent.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isAdmin && (
                          <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {user.subscription?.status === 'active' && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white">{selectedUser.fullName || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Joined</p>
                  <p className="text-white">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-white">${selectedUser.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {!selectedUser.isAdmin ? (
                <button
                  onClick={() => {
                    handleMakeAdmin(selectedUser.id);
                    setShowUserModal(false);
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Make Admin
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleRemoveAdmin(selectedUser.id);
                    setShowUserModal(false);
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove Admin
                </button>
              )}

              {selectedUser.subscription && (
                <button
                  onClick={() => {
                    handleCancelSubscription(selectedUser.id);
                    setShowUserModal(false);
                  }}
                  className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Cancel Subscription
                </button>
              )}

              <button
                onClick={() => setShowUserModal(false)}
                className="w-full px-4 py-2 border border-white/10 text-gray-400 rounded-lg hover:text-white hover:border-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}