import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log('Middleware: Processing request for:', req.nextUrl.pathname)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Skip middleware for public paths and API routes
  const publicPaths = ['/login', '/signup', '/onboarding', '/api', '/_next', '/static']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))
  const isRootPath = req.nextUrl.pathname === '/'
  
  if (isPublicPath || isRootPath) {
    console.log('Middleware: Skipping check for public path:', req.nextUrl.pathname)
    return res
  }

  // If user is authenticated, check onboarding status for protected routes
  if (session?.user) {
    console.log('Middleware: Checking onboarding status for user:', session.user.id)
    try {
      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('medical')
        .select('age, height, weight, medications, personal_health_context, family_history, allergies')
        .eq('id', session.user.id)
        .single()
      
      // If user record doesn't exist or onboarding is not complete, redirect to onboarding
      const isOnboardingComplete = profile && 
        profile.age !== null && 
        profile.height !== null && 
        profile.weight !== null && 
        profile.medications !== null && 
        profile.personal_health_context !== null && 
        profile.family_history !== null && 
        profile.allergies !== null
      
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