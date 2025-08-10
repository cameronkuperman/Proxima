import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  console.log('=== CHECKOUT SESSION START ===');
  
  try {
    // 1. Parse request body
    const { tier, billingCycle = 'monthly' } = await req.json();
    console.log('Request:', { tier, billingCycle });
    
    // 2. Validate input
    if (!tier || !['basic', 'pro', 'pro_plus'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400 }
      );
    }
    
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }
    
    // 3. Create Supabase client with proper cookie handling for API routes
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // API routes can't set cookies in the response like this
            // We'll handle this differently if needed
          },
          remove(name: string, options: any) {
            // API routes can't remove cookies like this
          },
        },
      }
    );
    
    // Get the user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { 
      hasUser: !!user, 
      userId: user?.id,
      error: authError?.message 
    });
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Please sign in to subscribe' },
        { status: 401 }
      );
    }
    
    // 4. Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle(); // Use maybeSingle to avoid errors
    
    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }
    
    // 5. Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle here too
    
    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
      console.log('Using existing Stripe customer:', stripeCustomerId);
    } else {
      // Create new Stripe customer
      console.log('Creating new Stripe customer for:', user.email);
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Save customer ID to database
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: stripeCustomerId,
        }, {
          onConflict: 'user_id',
        });
      
      console.log('Created new Stripe customer:', stripeCustomerId);
    }
    
    // 6. Get the price ID
    const priceId = getPriceId(tier, billingCycle);
    
    if (!priceId) {
      console.error('Price ID not found for:', tier, billingCycle);
      return NextResponse.json(
        { error: 'Price configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Creating checkout session with price:', priceId);
    
    // 7. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: user.id, // Important for webhook
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
    
    // 8. Return the checkout URL
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
    
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Export config to ensure proper cookie handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';