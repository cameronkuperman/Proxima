import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Create optimized Supabase client with connection pooling and better timeouts
export const supabaseOptimized = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Faster initialization
    debug: false // Disable debug for production
  },
  db: {
    schema: 'public'
  },
  global: {
    // Add request timeout
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
  // Connection pooling for better performance
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})