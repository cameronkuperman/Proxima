'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global flag to prevent multiple auth listeners
let authListenerInitialized = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    
    // Prevent multiple auth listeners
    if (authListenerInitialized) {
      logger.warn('AuthProvider: Auth listener already initialized, skipping...');
      // Still get the current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted.current) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });
      return;
    }
    
    authListenerInitialized = true;
    logger.debug('AuthProvider: Initializing auth listener...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.debug('AuthProvider: Initial session:', session ? 'Found user' : 'No session');
      if (mounted.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('AuthProvider: Auth state changed:', event, session ? 'User authenticated' : 'User not authenticated');
      
      if (mounted.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log user info when authenticated
        if (session?.user) {
          logger.debug('AuthProvider: User details:', {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name
          });
        }
      }
    });

    return () => {
      mounted.current = false;
      logger.debug('AuthProvider: Component unmounting');
      // Don't unsubscribe the global listener
    };
  }, []);

  const signOut = async () => {
    logger.debug('AuthProvider: Signing out user...');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 