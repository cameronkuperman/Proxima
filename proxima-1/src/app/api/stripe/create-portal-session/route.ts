import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to access billing' },
        { status: 401 }
      );
    }

    // Get user's subscription to find customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no subscription, check user profile for customer ID
    let customerId = subscription?.stripe_customer_id;
    
    if (!customerId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();
      
      customerId = profile?.stripe_customer_id;
    }

    if (!customerId) {
      // Create a new customer if none exists
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Save customer ID to profile
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
        });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?portal=true`,
      configuration: undefined, // Uses default portal configuration
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create portal session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}