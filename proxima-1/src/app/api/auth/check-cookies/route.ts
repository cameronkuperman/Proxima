import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const cookieInfo = allCookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value ? 'HAS_VALUE' : 'NO_VALUE',
    length: cookie.value?.length || 0,
    // Check for Supabase cookies
    isSupabase: cookie.name.includes('sb-') || cookie.name.includes('supabase')
  }))
  
  const supabaseCookies = cookieInfo.filter(c => c.isSupabase)
  
  return NextResponse.json({
    totalCookies: allCookies.length,
    supabaseCookies: supabaseCookies.length,
    cookies: cookieInfo,
    timestamp: new Date().toISOString()
  })
}