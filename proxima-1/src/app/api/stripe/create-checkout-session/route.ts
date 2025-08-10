import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  console.log('=== CHECKOUT SESSION START ===');
  
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://www.seimeo.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  try {
    // 1. Parse request body
    const { tier, billingCycle = 'monthly' } = await req.json();
    console.log('Request:', { tier, billingCycle });
    
    // 2. Validate input
    if (!tier || !['basic', 'pro', 'pro_plus'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400, headers }
      );
    }
    
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400, headers }
      );
    }
    
    // 3. Get cookies and check for auth token
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('Cookies found:', allCookies.map(c => c.name));
    
    // Look for Supabase session cookie
    const authTokenCookie = cookieStore.get('sb-ekaxwbatykostnmopnhn-auth-token');
    if (!authTokenCookie) {
      console.error('No auth token cookie found');
      return NextResponse.json(
        { error: 'Authentication required. Please sign in and try again.' },
        { status: 401, headers }
      );
    }
    
    // 4. Create Supabase client with auth token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // API routes can't set cookies in the response
          },
          remove(name: string, options: any) {
            // API routes can't remove cookies
          },
        },
      }
    );
    
    // Get the user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      error: authError?.message 
    });
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return NextResponse.json(
        { 
          error: 'Session expired or invalid. Please sign in again.',
          details: authError?.message 
        },
        { status: 401, headers }
      );
    }
    
    // 5. Check for existing active subscription
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();
    
    if (subError && subError.code !== 'PGRST116') {
      console.error('Subscription check error:', subError);
    }
    
    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400, headers }
      );
    }
    
    // 6. Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }
    
    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
      console.log('Using existing Stripe customer:', stripeCustomerId);
    } else {
      // Create new Stripe customer
      console.log('Creating new Stripe customer for:', user.email);
      try {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        
        stripeCustomerId = customer.id;
        
        // Save customer ID to database
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
            stripe_customer_id: stripeCustomerId,
          }, {
            onConflict: 'user_id',
          });
        
        if (upsertError) {
          console.error('Error saving customer ID:', upsertError);
        }
        
        console.log('Created new Stripe customer:', stripeCustomerId);
      } catch (stripeError: any) {
        console.error('Stripe customer creation error:', stripeError);
        return NextResponse.json(
          { 
            error: 'Failed to create payment profile',
            details: stripeError.message 
          },
          { status: 500, headers }
        );
      }
    }
    
    // 7. Get the price ID
    const priceId = getPriceId(tier, billingCycle);
    
    if (!priceId) {
      console.error('Price ID not found for:', tier, billingCycle);
      return NextResponse.json(
        { error: 'Price configuration error' },
        { status: 500, headers }
      );
    }
    
    console.log('Creating checkout session with price:', priceId);
    
    // 8. Create Stripe checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        client_reference_id: user.id,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: {
          user_id: user.id,
          tier: tier,
        },
      });
      
      console.log('Checkout session created:', session.id);
      
      // 9. Return the checkout URL
      return NextResponse.json(
        { 
          url: session.url,
          sessionId: session.id,
        },
        { headers }
      );
    } catch (stripeError: any) {
      console.error('Stripe session creation error:', stripeError);
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session',
          details: stripeError.message 
        },
        { status: 500, headers }
      );
    }
    
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message 
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://www.seimeo.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';