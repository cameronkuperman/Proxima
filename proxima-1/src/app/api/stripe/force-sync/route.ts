import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  console.log('=== FORCE SUBSCRIPTION SYNC ===');
  
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
    
    // Use service role for database operations
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
    
    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }
    
    console.log('Found Stripe customer:', profile.stripe_customer_id);
    
    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
    });
    
    console.log('Found', subscriptions.data.length, 'active subscriptions in Stripe');
    
    const synced = [];
    const errors = [];
    
    for (const stripeSub of subscriptions.data) {
      console.log('Processing subscription:', stripeSub.id);
      
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', stripeSub.id)
        .single();
      
      if (existing) {
        console.log('Subscription already exists, updating...');
        
        // Safe date handling for update
        const currentPeriodEnd = (stripeSub as any).current_period_end;
        let periodEndDate: string | null = null;
        
        if (currentPeriodEnd) {
          try {
            const timestamp = typeof currentPeriodEnd === 'number' ? currentPeriodEnd * 1000 : currentPeriodEnd;
            periodEndDate = new Date(timestamp).toISOString();
          } catch (e) {
            console.error('Error converting period end date:', e);
            periodEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
        }
        
        // Update existing subscription
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: stripeSub.status,
            current_period_end: periodEndDate,
            cancel_at_period_end: (stripeSub as any).cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSub.id);
        
        if (updateError) {
          errors.push({ subscription: stripeSub.id, error: updateError.message });
        } else {
          synced.push({ subscription: stripeSub.id, action: 'updated' });
        }
      } else {
        console.log('Creating new subscription record...');
        
        // Determine tier from price ID
        let tier = 'basic'; // default
        const priceId = stripeSub.items.data[0]?.price.id;
        
        console.log('Price ID:', priceId);
        console.log('Environment price IDs:', {
          basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
          basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
          pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
          pro_plus_monthly: process.env.STRIPE_PRO_PLUS_MONTHLY_PRICE_ID,
          pro_plus_yearly: process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID,
        });
        
        // Map price ID to tier
        if (priceId === process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 
            priceId === process.env.STRIPE_BASIC_YEARLY_PRICE_ID) {
          tier = 'basic';
        } else if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 
                   priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
          tier = 'pro';
        } else if (priceId === process.env.STRIPE_PRO_PLUS_MONTHLY_PRICE_ID || 
                   priceId === process.env.STRIPE_PRO_PLUS_YEARLY_PRICE_ID) {
          tier = 'pro_plus';
        }
        
        console.log('Determined tier:', tier);
        
        // Create new subscription with safe date handling
        const currentPeriodEnd = (stripeSub as any).current_period_end;
        let periodEndDate: string | null = null;
        
        if (currentPeriodEnd) {
          try {
            // Stripe timestamps are in seconds, convert to milliseconds
            const timestamp = typeof currentPeriodEnd === 'number' ? currentPeriodEnd * 1000 : currentPeriodEnd;
            periodEndDate = new Date(timestamp).toISOString();
          } catch (e) {
            console.error('Error converting period end date:', e);
            // Use a default date 30 days from now
            periodEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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
            current_period_end: periodEndDate,
            cancel_at_period_end: (stripeSub as any).cancel_at_period_end || false,
          });
        
        if (insertError) {
          console.error('Insert error:', insertError);
          errors.push({ subscription: stripeSub.id, error: insertError.message });
        } else {
          synced.push({ 
            subscription: stripeSub.id, 
            action: 'created',
            tier: tier,
            status: stripeSub.status
          });
        }
      }
    }
    
    // Get updated subscriptions from database
    const { data: dbSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);
    
    return NextResponse.json({
      success: true,
      synced: synced,
      errors: errors,
      currentSubscriptions: dbSubscriptions,
      message: `Synced ${synced.length} subscription(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ''}`
    });
    
  } catch (error: any) {
    console.error('Force sync error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';