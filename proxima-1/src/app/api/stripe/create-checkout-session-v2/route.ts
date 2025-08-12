import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('=== CHECKOUT SESSION V2 START ===');
  
  try {
    // 1. Parse request body
    const body = await req.json();
    const { tier, billingCycle = 'monthly', userId, userEmail } = body;
    console.log('Request:', { tier, billingCycle, userId, userEmail });
    
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
    
    // 3. Authenticate user - multiple methods
    let user: any = null;
    let userEmailFinal = userEmail;
    
    // Method 1: Try Bearer token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      console.log('Trying Bearer token auth...');
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
          },
        }
      );
      
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token);
      if (tokenUser && !error) {
        user = tokenUser;
        userEmailFinal = tokenUser.email;
        console.log('Bearer token auth successful:', user.id);
      } else {
        console.log('Bearer token auth failed:', error?.message);
      }
    }
    
    // Method 2: If userId and email provided directly (for trusted internal calls)
    if (!user && userId && userEmail) {
      console.log('Using provided userId and email:', userId);
      // Verify the user exists in database
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
        .select('user_id, email')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        user = { id: userId, email: userEmail };
        console.log('Direct userId auth successful');
      }
    }
    
    // If no authentication method succeeded
    if (!user) {
      console.error('All authentication methods failed');
      return NextResponse.json(
        { error: 'Authentication required. Please sign in and try again.' },
        { status: 401 }
      );
    }
    
    // 4. Use service role for all database operations
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
    
    // 5. Check for existing active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();
    
    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }
    
    // 6. Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
      console.log('Using existing Stripe customer:', stripeCustomerId);
    } else {
      // Create new Stripe customer
      console.log('Creating new Stripe customer for:', userEmailFinal);
      const customer = await stripe().customers.create({
        email: userEmailFinal!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Save customer ID to database
      const { error: upsertError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: userEmailFinal,
          stripe_customer_id: stripeCustomerId,
        }, {
          onConflict: 'user_id',
        });
        
      if (upsertError) {
        console.error('Failed to save customer ID:', upsertError);
      }
      
      console.log('Created new Stripe customer:', stripeCustomerId);
    }
    
    // 7. Get the price ID
    const priceId = getPriceId(tier, billingCycle);
    
    if (!priceId) {
      console.error('Price ID not found for:', tier, billingCycle);
      return NextResponse.json(
        { error: 'Price configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Creating checkout session with price:', priceId);
    
    // 8. Create Stripe checkout session
    const session = await stripe().checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
    });
    
    console.log('Checkout session created:', session.id);
    
    // 9. Return the checkout URL
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
    
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';