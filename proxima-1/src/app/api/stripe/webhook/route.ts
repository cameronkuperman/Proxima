import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Disable body parsing, we need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }
  
  // Initialize Supabase with service role for admin operations
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
  
  // Check for idempotency
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single();
  
  if (existingEvent) {
    console.log('Event already processed:', event.id);
    return NextResponse.json({ received: true });
  }
  
  // Record the event
  await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: event.id,
      processed: false,
    });
  
  try {
    switch (event.type) {
      // Handle successful checkout
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.client_reference_id;
          
          if (!userId) {
            console.error('No user ID in checkout session');
            break;
          }
          
          // Retrieve the subscription details
          const subscription = await stripe().subscriptions.retrieve(
            session.subscription as string
          ) as Stripe.Subscription;
          
          // Extract tier from metadata
          const tier = session.metadata?.tier || 'unknown';
          
          // Create subscription record
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status,
              tier: tier,
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: (subscription as any).cancel_at_period_end,
            });
          
          console.log('Subscription created for user:', userId);
        }
        break;
      }
      
      // Handle subscription updates
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (subscription as any).cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        console.log('Subscription updated:', subscription.id);
        break;
      }
      
      // Handle subscription deletion
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        console.log('Subscription canceled:', subscription.id);
        break;
      }
      
      // Handle successful payments
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        // You can add payment logging here if needed
        break;
      }
      
      // Handle failed payments
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        
        if ((invoice as any).subscription) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', (invoice as any).subscription);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);
    
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Don't return error to Stripe, log for manual investigation
  }
  
  return NextResponse.json({ received: true });
}