import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  
  // Create a new Supabase client
  const supabase = createClient()
  
  // Generate OAuth URL with proper PKCE
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  })
  
  if (error) {
    console.error('OAuth initialization error:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }
  
  if (data?.url) {
    // Redirect to the OAuth URL
    return NextResponse.redirect(data.url)
  }
  
  return NextResponse.redirect(`${origin}/login?error=Could not initialize OAuth`)
}