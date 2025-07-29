import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/utils/logger'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  logger.debug('Session check:', {
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