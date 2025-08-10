// Temporary test endpoint that bypasses auth for testing Stripe
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, getStripePriceId } from '@/lib/stripe';

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

    // For testing only - use a test email
    const testEmail = 'test@seimeo.com';
    const testUserId = 'test-user-123';

    // Get price ID
    const priceId = getStripePriceId(tier, billingCycle);
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier or billing cycle' },
        { status: 400 }
      );
    }

    // Create test customer
    let customer;
    try {
      // Try to retrieve existing customer first
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
            test_user: 'true',
            user_id: testUserId,
          },
        });
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Failed to create customer', details: err.message },
        { status: 500 }
      );
    }

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
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
          user_id: testUserId,
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