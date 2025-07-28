import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  console.log('Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    error: error?.message,
    cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  })
  
  return NextResponse.json({ 
    session: session ? {
      user: {
        id: session.user.id,
        email: session.user.email
      }
    } : null,
    error: error?.message 
  })
}