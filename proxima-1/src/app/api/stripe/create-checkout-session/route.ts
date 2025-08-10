import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export async function POST(req: NextRequest) {
  console.log('=== CREATE CHECKOUT SESSION START ===');
  
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
    
    // 3. Check authentication using Supabase server client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { 
      authenticated: !!user, 
      userId: user?.id,
      error: authError?.message 
    });
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to subscribe' },
        { status: 401 }
      );
    }
    
    // 4. Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status, tier')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();
    
    if (existingSub) {
      console.log('User has existing subscription:', existingSub);
      return NextResponse.json(
        { 
          error: 'You already have an active subscription. Please manage it from your profile.',
          hasSubscription: true 
        },
        { status: 400 }
      );
    }
    
    // 5. Get or create Stripe customer
    let customerId: string;
    
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
      console.log('Using existing Stripe customer:', customerId);
    } else {
      // Create new Stripe customer
      console.log('Creating new Stripe customer for user:', user.email);
      
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Save customer ID to database
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
        }, {
          onConflict: 'user_id',
        });
      
      console.log('Created new Stripe customer:', customerId);
    }
    
    // 6. Get the correct price ID from environment variables
    const priceKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billingCycle.toUpperCase()}`;
    const priceId = process.env[priceKey];
    
    console.log('Price lookup:', { priceKey, priceId: priceId ? 'found' : 'not found' });
    
    if (!priceId) {
      console.error('Price ID not found for:', priceKey);
      return NextResponse.json(
        { error: 'Price configuration error. Please contact support.' },
        { status: 500 }
      );
    }
    
    // 7. Create Stripe checkout session
    console.log('Creating checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id, // CRITICAL: Links payment to user
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        user_id: user.id,
        user_email: user.email!,
        tier: tier,
        billing_cycle: billingCycle,
      },
    });
    
    console.log('Checkout session created:', {
      id: session.id,
      url: session.url ? 'present' : 'missing',
    });
    
    // 8. Return the checkout URL
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
    
  } catch (error: any) {
    console.error('Checkout session error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    });
    
    // Return user-friendly error messages
    let userMessage = 'Failed to create checkout session';
    
    if (error.type === 'StripeAuthenticationError') {
      userMessage = 'Payment system configuration error';
    } else if (error.type === 'StripeInvalidRequestError') {
      userMessage = 'Invalid request. Please try again.';
    } else if (error.code === 'resource_missing') {
      userMessage = 'Product not found. Please contact support.';
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}