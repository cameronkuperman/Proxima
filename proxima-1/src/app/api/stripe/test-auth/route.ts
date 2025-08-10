import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  console.log('=== TEST AUTH START ===');
  
  try {
    // Log all cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // Look for Supabase auth cookies
    const authToken = cookieStore.get('sb-ekaxwbatykostnmopnhn-auth-token');
    console.log('Auth token cookie exists:', !!authToken);
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`Getting cookie ${name}:`, !!value);
            return value;
          },
          set() {},
          remove() {},
        },
      }
    );
    
    // Try to get user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: error?.message
    });
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
      } : null,
      error: error?.message,
      hasCookies: allCookies.length > 0,
      hasAuthToken: !!authToken,
    });
    
  } catch (error: any) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      error: error.message,
      authenticated: false,
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';