import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const url = new URL(request.url)
  
  // Get all cookies
  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('sb-'))
  
  // Get all URL params
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  // Check for hash params (though server can't see them)
  const debugInfo = {
    cookies: {
      total: allCookies.length,
      supabase: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
    },
    url: {
      full: request.url,
      origin: url.origin,
      pathname: url.pathname,
      params
    },
    headers: {
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
      'user-agent': request.headers.get('user-agent')
    },
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(debugInfo, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}