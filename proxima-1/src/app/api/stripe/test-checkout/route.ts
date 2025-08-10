// Temporary test endpoint that bypasses auth for testing Stripe
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, getStripePriceId } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { tier, billingCycle = 'monthly' } = await req.json();

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured - check STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    // Get the ACTUAL logged in user (if any) or create a test user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    let testEmail = 'test@seimeo.com';
    let testUserId = 'test-user-123';
    
    // If user is logged in, use their real data
    if (user && !userError) {
      testEmail = user.email || 'test@seimeo.com';
      testUserId = user.id;
    }

    // Get price ID
    const priceId = getStripePriceId(tier, billingCycle);
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier or billing cycle' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer - check if user already has one
    let customer;
    try {
      // If real user, check for existing customer ID in database
      if (user && !userError) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_customer_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.stripe_customer_id) {
          // Use existing customer
          customer = await stripe.customers.retrieve(profile.stripe_customer_id);
        }
      }
      
      // If no existing customer, create new one
      if (!customer) {
        const customers = await stripe.customers.list({
          email: testEmail,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          customer = customers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: testEmail,
            metadata: {
              supabase_user_id: testUserId, // Use consistent key name
              user_id: testUserId,
            },
          });
          
          // Save customer ID to profile if real user
          if (user && !userError) {
            await supabase
              .from('user_profiles')
              .upsert({
                user_id: user.id,
                email: testEmail,
                stripe_customer_id: customer.id,
              }, {
                onConflict: 'user_id'
              });
          }
        }
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Failed to create customer', details: err.message },
        { status: 500 }
      );
    }

    // Create checkout session with proper user ID
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        client_reference_id: testUserId, // This is critical for webhook to know the user!
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: {
          user_id: testUserId, // Real user ID now!
          tier: tier,
          billing_cycle: billingCycle,
        },
      });

      return NextResponse.json({ 
        url: session.url,
        sessionId: session.id,
        message: 'Test checkout session created successfully',
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Failed to create checkout session', details: err.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}