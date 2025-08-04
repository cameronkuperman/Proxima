import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAuthEvent } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Create Supabase client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(url, key);

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login attempt
      await logAuthEvent(
        'LOGIN_FAILURE',
        null,
        request,
        {
          email,
          error: error.message,
        }
      );

      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (data.user) {
      // Log successful login
      await logAuthEvent(
        'LOGIN_SUCCESS',
        data.user.id,
        request,
        {
          email: data.user.email,
          method: 'password',
        }
      );

      return NextResponse.json({
        user: data.user,
        session: data.session,
      });
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}