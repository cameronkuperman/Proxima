import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client and verify user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to manage subscription' },
        { status: 401 }
      );
    }
    
    // Use service role to get user's Stripe customer ID
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    
    // Create portal session with return to subscription page
    const session = await stripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?updated=true`,
    });
    
    // Return portal URL
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

// Export config to ensure proper cookie handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';