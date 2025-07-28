import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('OAuth callback received:', {
    hasCode: !!code,
    error,
    errorDescription,
    fullUrl: request.url,
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth provider error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    try {
      const supabase = createClient()
      
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
      }
      
      if (!data.session) {
        console.error('No session returned after code exchange')
        return NextResponse.redirect(`${requestUrl.origin}/login?error=No session created`)
      }
      
      console.log('Successfully authenticated:', {
        userId: data.session.user.id,
        email: data.session.user.email,
      })
      
      // Check if user needs onboarding
      const { data: profile } = await supabase
        .from('medical')
        .select('age, height, weight, personal_health_context')
        .eq('id', data.session.user.id)
        .single()
      
      const needsOnboarding = !profile || !profile.age || !profile.height || !profile.weight || !profile.personal_health_context
      
      if (needsOnboarding) {
        // Create medical record if it doesn't exist
        if (!profile) {
          await supabase.from('medical').insert({
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.full_name || 
                  data.session.user.user_metadata?.name || 
                  data.session.user.email?.split('@')[0] || '',
            medications: [],
            family_history: [],
            allergies: [],
            race: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
        
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
      }
      
      // User has completed onboarding
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed`)
    }
  }

  // No code received
  console.error('No authorization code received')
  return NextResponse.redirect(`${requestUrl.origin}/login?error=No authorization code received`)
}