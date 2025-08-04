import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// In-memory storage for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configurations for different endpoints
const RATE_LIMITS = {
  // AI endpoints - expensive, need strict limits
  '/api/quick-scan': { requests: 5, windowMs: 60000 }, // 5 per minute
  '/api/deep-dive': { requests: 3, windowMs: 60000 }, // 3 per minute
  '/api/photo-analysis': { requests: 5, windowMs: 60000 }, // 5 per minute
  '/api/oracle': { requests: 10, windowMs: 60000 }, // 10 per minute
  
  // Report generation - resource intensive
  '/api/reports': { requests: 10, windowMs: 3600000 }, // 10 per hour
  
  // Auth endpoints - prevent brute force
  '/api/auth': { requests: 5, windowMs: 900000 }, // 5 per 15 minutes
  
  // Data fetching - normal usage
  '/api/timeline': { requests: 30, windowMs: 60000 }, // 30 per minute
  '/api/history': { requests: 30, windowMs: 60000 }, // 30 per minute
  '/api/test-user': { requests: 10, windowMs: 60000 }, // 10 per minute
  
  // Default for other endpoints
  default: { requests: 60, windowMs: 60000 } // 60 per minute
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function getRateLimitConfig(pathname: string) {
  // Find the most specific matching config
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config
    }
  }
  return RATE_LIMITS.default
}

export async function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip rate limiting for health checks or internal endpoints
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  
  // Try to get user ID from Supabase session for authenticated routes
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'anonymous'
  
  let identifier = `ip-${ip}`
  
  try {
    // Create Supabase client to check for authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options })
          }
        }
      }
    )
    const { data: { session } } = await supabase.auth.getSession()
    
    // Use user ID for rate limiting if authenticated
    if (session?.user?.id) {
      identifier = `user-${session.user.id}`
    }
  } catch (error) {
    // If session check fails, continue with IP-based rate limiting
    console.error('Rate limit session check error:', error)
  }

  const pathname = request.nextUrl.pathname
  const config = getRateLimitConfig(pathname)
  const key = `${identifier}-${pathname}`
  
  const now = Date.now()
  const limitData = rateLimitStore.get(key) || {
    count: 0,
    resetTime: now + config.windowMs
  }

  // Reset if window has passed
  if (now > limitData.resetTime) {
    limitData.count = 0
    limitData.resetTime = now + config.windowMs
  }

  // Increment request count
  limitData.count++
  rateLimitStore.set(key, limitData)

  // Add rate limit headers
  const remaining = Math.max(0, config.requests - limitData.count)
  const reset = new Date(limitData.resetTime).toISOString()
  
  response.headers.set('X-RateLimit-Limit', config.requests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset)

  // Check if rate limit exceeded
  if (limitData.count > config.requests) {
    const retryAfter = Math.ceil((limitData.resetTime - now) / 1000)
    
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: config.requests,
        window: `${config.windowMs / 1000} seconds`,
        reset
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset
        }
      }
    )
  }

  // Add warning when approaching limit
  if (remaining <= Math.ceil(config.requests * 0.2)) {
    response.headers.set('X-RateLimit-Warning', `Only ${remaining} requests remaining`)
  }

  return response
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth callback routes (to not interfere with OAuth flow)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/callback).*)',
  ]
}