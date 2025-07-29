import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/utils/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
      token_hash,
    })
    
    if (!error) {
      // Ensure session is established before redirect
      const { data: { session } } = await supabase.auth.getSession()
      logger.debug('Email confirmation successful, session:', !!session)
      
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=Could not verify email', request.url))
}