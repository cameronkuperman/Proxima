import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log('Middleware: Processing request for:', req.nextUrl.pathname)

  // Check for OAuth redirect cookie
  const oauthRedirectCookie = req.cookies.get('oauth_onboarding_redirect')
  if (oauthRedirectCookie?.value === 'true') {
    console.log('Middleware: OAuth onboarding redirect detected, allowing access')
    // Clear the cookie
    res.cookies.delete('oauth_onboarding_redirect')
    return res
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Debug logging for OAuth users
  if (session?.user) {
    console.log('Middleware: User authenticated:', {
      id: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata?.provider,
      hasUserMetadata: !!session.user.user_metadata,
      path: req.nextUrl.pathname
    })
  }

  // Skip middleware for public paths and API routes
  const publicPaths = ['/login', '/signup', '/onboarding', '/api', '/_next', '/static', '/auth/callback']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))
  const isRootPath = req.nextUrl.pathname === '/'
  
  if (isPublicPath || isRootPath) {
    console.log('Middleware: Skipping check for public path:', req.nextUrl.pathname)
    return res
  }

  // If user is authenticated, check onboarding status for protected routes
  if (session?.user) {
    // Check for OAuth redirect cookie
    const oauthRedirectCookie = req.cookies.get('oauth_onboarding_redirect');
    if (oauthRedirectCookie?.value === 'true') {
      console.log('Middleware: OAuth redirect detected, allowing access');
      // Clear the cookie
      res.cookies.delete('oauth_onboarding_redirect');
      return res;
    }
    
    console.log('Middleware: Checking onboarding status for user:', session.user.id)
    try {
      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('medical')
        .select('age, height, weight, personal_health_context')
        .eq('id', session.user.id)
        .maybeSingle()
      
      if (profileError) {
        console.error('Middleware: Error fetching medical profile:', profileError)
        // Always redirect to onboarding if medical record fetch fails
        console.log('Middleware: No medical record found, redirecting to onboarding')
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
      
      // If user record doesn't exist or basic fields are not filled, redirect to onboarding
      const isOnboardingComplete = profile && 
        profile.age && profile.age.trim() !== '' &&
        profile.height && profile.height.trim() !== '' &&
        profile.weight && profile.weight.trim() !== '' &&
        profile.personal_health_context && profile.personal_health_context.trim() !== ''
      
      console.log('Middleware: Onboarding check result:', {
        hasProfile: !!profile,
        hasAge: !!(profile?.age && profile.age.trim() !== ''),
        hasHeight: !!(profile?.height && profile.height.trim() !== ''),
        hasWeight: !!(profile?.weight && profile.weight.trim() !== ''),
        hasHealthContext: !!(profile?.personal_health_context && profile.personal_health_context.trim() !== ''),
        isComplete: isOnboardingComplete
      })
      
      if (!isOnboardingComplete) {
        console.log('Middleware: User onboarding incomplete, redirecting to onboarding')
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
      
      console.log('Middleware: User onboarding complete, allowing access')
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      // On error, redirect to onboarding to be safe
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  } else {
    console.log('Middleware: No session found, allowing request to continue')
  }

  console.log('Middleware: Request allowed to continue to:', req.nextUrl.pathname)
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 