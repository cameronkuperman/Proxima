'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Initial session:', session ? 'Found user' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session ? 'User authenticated' : 'User not authenticated');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Log user info when authenticated
      if (session?.user) {
        console.log('AuthProvider: User details:', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name
        });
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out user...');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  console.log('AuthProvider: Current state:', {
    hasSession: !!session,
    hasUser: !!user,
    loading,
    userEmail: user?.email
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 