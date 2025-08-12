import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  console.log('=== TEST SUBSCRIPTION SYNC ===');
  
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Use service role to check database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // 1. Check user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('User profile:', profile);
    
    // 2. Check existing subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('Existing subscriptions:', subscriptions);
    
    // 3. If user has Stripe customer ID, check Stripe for active subscriptions
    let stripeSubscriptions = null;
    if (profile?.stripe_customer_id) {
      try {
        const subs = await stripe().subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
        });
        stripeSubscriptions = subs.data;
        console.log('Stripe subscriptions:', stripeSubscriptions);
        
        // Sync any missing subscriptions
        for (const stripeSub of stripeSubscriptions) {
          const exists = subscriptions?.find(s => s.stripe_subscription_id === stripeSub.id);
          
          if (!exists && stripeSub.status === 'active') {
            console.log('Found unsynced subscription, adding to database:', stripeSub.id);
            
            // Get tier from price metadata or default
            let tier = 'basic';
            if (stripeSub.items.data[0]?.price.id) {
              const priceId = stripeSub.items.data[0].price.id;
              // Map price ID to tier
              if (priceId.includes('pro_plus') || priceId === process.env.STRIPE_PRO_PLUS_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID) {
                tier = 'pro_plus';
              } else if (priceId.includes('pro') || priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
                tier = 'pro';
              } else if (priceId.includes('basic') || priceId === process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_BASIC_YEARLY_PRICE_ID) {
                tier = 'basic';
              }
            }
            
            const { error: insertError } = await supabaseAdmin
              .from('subscriptions')
              .insert({
                user_id: user.id,
                stripe_subscription_id: stripeSub.id,
                stripe_customer_id: stripeSub.customer as string,
                status: stripeSub.status,
                tier: tier,
                current_period_end: new Date((stripeSub as any).current_period_end * 1000).toISOString(),
                cancel_at_period_end: (stripeSub as any).cancel_at_period_end,
              });
            
            if (insertError) {
              console.error('Failed to insert subscription:', insertError);
            } else {
              console.log('Successfully synced subscription');
            }
          }
        }
      } catch (stripeError: any) {
        console.error('Stripe API error:', stripeError.message);
      }
    }
    
    // 4. Check webhook events
    const { data: webhookEvents } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('Recent webhook events:', webhookEvents);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile,
      subscriptions: subscriptions,
      stripeSubscriptions: stripeSubscriptions,
      recentWebhooks: webhookEvents,
    });
    
  } catch (error: any) {
    console.error('Test subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';