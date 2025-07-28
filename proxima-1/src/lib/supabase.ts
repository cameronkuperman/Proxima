import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Validate URL format
if (!SUPABASE_URL.includes('.supabase.co')) {
  throw new Error(
    'Invalid Supabase URL format. Expected format: https://[project-ref].supabase.co'
  )
}

console.log('Supabase client initialized with URL:', SUPABASE_URL)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'proxima-auth',
    flowType: 'pkce',
    debug: true  // Enable debug mode to see what's happening
  }
}) 