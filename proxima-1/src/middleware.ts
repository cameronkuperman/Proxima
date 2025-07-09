import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Only handle auth redirects for specific paths to avoid conflicts with AuthGuard
  // Let AuthGuard components handle the detailed routing logic
  
  return res
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/profile/:path*',
    '/oracle/:path*',
    '/intelligence/:path*',
  ],
} 