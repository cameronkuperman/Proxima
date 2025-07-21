import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Log ALL parameters received
  const allParams: Record<string, string> = {}
  requestUrl.searchParams.forEach((value, key) => {
    allParams[key] = value
  })

  console.log('OAuth callback received:', {
    hasCode: !!code,
    error,
    errorDescription,
    fullUrl: request.url,
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    allParams,
    headers: {
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
    }
  })

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth provider error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('OAuth callback: Error exchanging code:', exchangeError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        )
      }
      
      console.log('OAuth callback: Successfully exchanged code for session', {
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        provider: data.session?.user?.app_metadata?.provider
      })
      
      // Create medical record for OAuth users if it doesn't exist
      if (data.session?.user) {
        // Check if medical record already exists
        const { data: existingProfile } = await supabase
          .from('medical')
          .select('id, age, height, weight, personal_health_context')
          .eq('id', data.session.user.id)
          .single()
        
        let isNewUser = false;
        
        // Only create if it doesn't exist
        if (!existingProfile) {
          isNewUser = true;
          const { error: profileError } = await supabase
            .from('medical')
            .insert({
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: data.session.user.user_metadata?.full_name || 
                    data.session.user.user_metadata?.name || 
                    data.session.user.email?.split('@')[0] || '',
              // Don't pre-fill any other fields - let onboarding handle them
              medications: [],  // Empty array for ARRAY type
              family_history: [],  // Empty array for JSONB
              allergies: [],  // Empty array for JSONB
              race: [],  // Empty array for JSONB
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (profileError) {
            console.error('Failed to create medical record for OAuth user:', profileError)
            // Don't fail the auth flow, let onboarding handle this
          } else {
            console.log('Created initial medical record for OAuth user')
          }
        } else {
          // Check if existing user has completed onboarding
          const isOnboardingComplete = existingProfile.age && 
                                       existingProfile.height && 
                                       existingProfile.weight && 
                                       existingProfile.personal_health_context;
          
          if (!isOnboardingComplete) {
            isNewUser = true; // Treat as new user if onboarding not complete
          }
          
          console.log('Medical record already exists for OAuth user, onboarding complete:', !isNewUser)
        }
        
        // Small delay to ensure database writes complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect based on user status
        if (isNewUser) {
          console.log('OAuth callback: New user or incomplete onboarding, redirecting to onboarding');
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      }
    } catch (error) {
      console.error('OAuth callback: Unexpected error:', error)
      return NextResponse.redirect(
        new URL('/login?error=Authentication%20failed', request.url)
      )
    }
  } else {
    console.error('OAuth callback: No code parameter received')
    return NextResponse.redirect(
      new URL('/login?error=No%20authorization%20code%20received', request.url)
    )
  }

  // URL to redirect to after sign in process completes
  // If we get here, user has completed onboarding
  console.log('OAuth callback: Existing user with complete onboarding, redirecting to dashboard');
  return NextResponse.redirect(new URL('/dashboard', request.url))
}