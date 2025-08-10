import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

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
    
    // 3. Check authentication
    const supabase = await createClient();
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
      .single();
    
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
      .single();
    
    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      // Create new Stripe customer
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
    
    // 8. Return the checkout URL
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}