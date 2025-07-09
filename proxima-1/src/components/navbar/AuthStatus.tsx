'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-400 font-light">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-300 font-light">
          <span>Welcome, </span>
          <span className="text-white font-medium">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-700 hover:bg-gray-900/70 rounded-lg transition-all duration-200"
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
        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-700 hover:bg-gray-900/70 rounded-lg transition-all duration-200"
      >
        Sign In
      </button>
    </div>
  );
} 