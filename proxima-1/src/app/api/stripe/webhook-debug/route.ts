import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  console.log('=== WEBHOOK DEBUG ===');
  console.log('Signature present:', !!signature);
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }
  
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Only handle subscription updates for debugging
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const previousAttributes = event.data.previous_attributes as any;
    
    console.log('=== SUBSCRIPTION UPDATE DEBUG ===');
    console.log('Subscription ID:', subscription.id);
    console.log('Current cancel_at_period_end:', (subscription as any).cancel_at_period_end);
    console.log('Previous cancel_at_period_end:', previousAttributes?.cancel_at_period_end);
    console.log('Canceled at:', (subscription as any).canceled_at);
    console.log('Cancel at:', (subscription as any).cancel_at);
    console.log('Cancellation details:', (subscription as any).cancellation_details);
    console.log('Metadata:', (subscription as any).metadata);
    
    // Try to update the database
    const updateData: any = {
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };
    
    // If being canceled
    if ((subscription as any).cancel_at_period_end) {
      console.log('Setting cancellation data...');
      updateData.cancellation_reason = 'stripe_portal_debug';
      updateData.canceled_at = new Date().toISOString();
      updateData.cancellation_feedback = 'Via Stripe Portal';
    } else {
      console.log('Clearing cancellation data...');
      updateData.cancellation_reason = null;
      updateData.canceled_at = null;
      updateData.cancellation_feedback = null;
    }
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    // First, check if subscription exists
    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    console.log('Existing subscription found:', !!existingSub);
    console.log('Fetch error:', fetchError);
    
    if (existingSub) {
      console.log('Current DB state:', {
        cancel_at_period_end: existingSub.cancel_at_period_end,
        canceled_at: existingSub.canceled_at,
        cancellation_reason: existingSub.cancellation_reason,
      });
      
      // Try to update
      const { data: updateResult, error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscription.id)
        .select();
      
      console.log('Update result:', updateResult);
      console.log('Update error:', updateError);
      
      if (updateError) {
        console.error('FAILED TO UPDATE:', updateError);
        return NextResponse.json({ 
          error: 'Database update failed',
          details: updateError,
          updateData 
        }, { status: 500 });
      }
      
      // Verify the update
      const { data: verifyData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      
      console.log('After update DB state:', {
        cancel_at_period_end: verifyData?.cancel_at_period_end,
        canceled_at: verifyData?.canceled_at,
        cancellation_reason: verifyData?.cancellation_reason,
      });
      
      // Log event
      const { data: subUser } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      
      if (subUser?.user_id) {
        const eventType = (subscription as any).cancel_at_period_end ? 
          'portal_cancellation_debug' : 'portal_resume_debug';
        
        const { error: eventError } = await supabase
          .from('subscription_events')
          .insert({
            user_id: subUser.user_id,
            event_type: eventType,
            metadata: {
              stripe_subscription_id: subscription.id,
              cancel_at_period_end: (subscription as any).cancel_at_period_end,
              previous_cancel_state: previousAttributes?.cancel_at_period_end,
              timestamp: new Date().toISOString(),
            },
          });
        
        console.log('Event logged:', !eventError);
        if (eventError) console.error('Event error:', eventError);
      }
    } else {
      console.log('NO SUBSCRIPTION FOUND IN DB!');
    }
  }
  
  return NextResponse.json({ 
    received: true,
    event_type: event.type,
    debug_mode: true 
  });
}