'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-300">
          <span>Welcome, </span>
          <span className="text-white font-medium">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Dashboard
        </button>
        <button
          onClick={() => signOut()}
          className="px-3 py-1 text-sm border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 text-sm border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors"
      >
        Sign In
      </button>
    </div>
  );
} 