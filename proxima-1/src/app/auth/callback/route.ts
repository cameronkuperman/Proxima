import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/utils/logger'
import { logAuthEvent } from '@/lib/audit-logger'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  logger.debug('Auth callback - Full URL:', request.url)
  logger.debug('Auth callback - Search params:', requestUrl.search)
  
  // Log all parameters for debugging
  const params: Record<string, string> = {}
  requestUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })
  logger.debug('Auth callback - All params:', params)
  
  // Check for errors first
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  if (error) {
    logger.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }
  
  // For implicit flow, Supabase handles everything client-side
  // Just redirect to home and let the client handle it
  logger.debug('Redirecting to home for client-side auth handling...')
  
  // Try to log OAuth login (best effort - may not have session yet)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (url && key) {
      // Create a supabase client to check session
      const supabase = createClient(url, key)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await logAuthEvent(
          'OAUTH_LOGIN',
          session.user.id,
          request,
          {
            provider: session.user.app_metadata?.provider || 'unknown',
            email: session.user.email,
          }
        )
      }
    }
  } catch (error) {
    logger.error('Failed to log OAuth event:', error)
  }
  
  // Add a marker so we know this is from OAuth callback
  const redirectUrl = new URL('/', requestUrl.origin)
  redirectUrl.searchParams.set('oauth_callback', 'true')
  
  return NextResponse.redirect(redirectUrl.toString())
}