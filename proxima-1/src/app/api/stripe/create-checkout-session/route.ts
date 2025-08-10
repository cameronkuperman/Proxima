import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, STRIPE_CONFIG, getStripePriceId } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { 
      priceId, 
      tier,
      billingCycle = 'monthly',
      mode = 'subscription' 
    } = await req.json();

    // Get the current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.error('Auth failed:', authError);
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      console.error('Stripe not configured - check STRIPE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Get or create user profile with Stripe customer
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        customerId = customer.id;
      } catch (stripeError: any) {
        console.error('Stripe customer creation error:', stripeError);
        return NextResponse.json(
          { error: 'Failed to create payment customer', details: stripeError.message },
          { status: 500 }
        );
      }

      // Update or create user profile with Stripe customer ID
      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            stripe_customer_id: customerId,
          });
      }
    }

    // Determine the price ID
    let finalPriceId = priceId;
    if (!finalPriceId && tier && billingCycle) {
      finalPriceId = getStripePriceId(tier, billingCycle);
    }

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Invalid price selection' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      // User already has a subscription, redirect to portal for management
      return NextResponse.json({
        error: 'You already have an active subscription. Please use the customer portal to manage your subscription.',
        hasSubscription: true,
      }, { status: 400 });
    }

    // Create Stripe checkout session with multi-currency and PayPal support
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode,
      payment_method_types: STRIPE_CONFIG.paymentMethods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'JP'],
      },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // Enable automatic tax calculation
      automatic_tax: {
        enabled: STRIPE_CONFIG.automaticTax,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Success and cancel URLs
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      // Metadata for webhook processing
      metadata: {
        user_id: user.id,
        tier: tier || 'unknown',
        billing_cycle: billingCycle,
      },
      // Set up trial if needed (but you said no trials)
      // subscription_data: {
      //   trial_period_days: 7,
      // },
      // Consent collection for marketing
      consent_collection: {
        terms_of_service: 'required',
        promotions: 'auto',
      },
      // Custom fields for additional info
      custom_fields: [
        {
          key: 'company_name',
          label: {
            type: 'custom',
            custom: 'Company Name (Optional)',
          },
          type: 'text',
          optional: true,
        },
      ],
      // Session expiration
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}