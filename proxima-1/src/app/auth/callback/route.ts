import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  console.log('Auth callback - Full URL:', request.url)
  console.log('Auth callback - Search params:', requestUrl.search)
  
  // Log all parameters for debugging
  const params: Record<string, string> = {}
  requestUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })
  console.log('Auth callback - All params:', params)
  
  // Check for errors first
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }
  
  // For implicit flow, Supabase handles everything client-side
  // Just redirect to home and let the client handle it
  console.log('Redirecting to home for client-side auth handling...')
  
  // Add a marker so we know this is from OAuth callback
  const redirectUrl = new URL('/', requestUrl.origin)
  redirectUrl.searchParams.set('oauth_callback', 'true')
  
  return NextResponse.redirect(redirectUrl.toString())
}