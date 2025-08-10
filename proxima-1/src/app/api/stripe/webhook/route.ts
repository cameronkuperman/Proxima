import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Webhook handler
export async function POST(req: NextRequest) {
  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  
  // Get the raw body as text for signature verification
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('No stripe-signature header');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
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
  
  console.log('Webhook event:', {
    type: event.type,
    id: event.id,
  });
  
  // Initialize Supabase Admin client
  const supabase = await createClient();
  
  try {
    switch (event.type) {
      // ============================================
      // CHECKOUT COMPLETED - Create subscription record
      // ============================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          clientReferenceId: session.client_reference_id,
          metadata: session.metadata,
        });
        
        // Get user ID from client_reference_id (set during checkout)
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.error('No user ID in checkout session');
          return NextResponse.json({ received: true, error: 'No user ID' });
        }
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          console.error('Invalid user ID format:', userId);
          return NextResponse.json({ received: true, error: 'Invalid user ID' });
        }
        
        // Only process subscription mode checkouts
        if (session.mode === 'subscription' && session.subscription) {
          // Retrieve full subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          ) as Stripe.Subscription;
          
          console.log('Subscription details:', {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            items: (subscription as any).items.data[0]?.price.id,
          });
          
          // Extract tier from metadata
          const tier = session.metadata?.tier || 'unknown';
          const billingCycle = session.metadata?.billing_cycle || 'monthly';
          
          // Create subscription record in database
          const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status,
              tier: tier,
              billing_cycle: billingCycle,
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: (subscription as any).cancel_at_period_end,
              metadata: {
                stripe_price_id: (subscription as any).items.data[0]?.price.id,
                stripe_product_id: (subscription as any).items.data[0]?.price.product,
              },
            })
            .select()
            .single();
          
          if (subError) {
            console.error('Error creating subscription:', subError);
            // Don't fail the webhook - we can retry later
          } else {
            console.log('Subscription created:', subData);
          }
          
          // Update user profile with subscription status
          await supabase
            .from('user_profiles')
            .update({ 
              stripe_customer_id: subscription.customer as string,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }
        
        break;
      }
      
      // ============================================
      // SUBSCRIPTION UPDATED - Update our records
      // ============================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        });
        
        // Update subscription in database
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (subscription as any).cancel_at_period_end,
            canceled_at: (subscription as any).canceled_at 
              ? new Date((subscription as any).canceled_at * 1000).toISOString() 
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (updateError) {
          console.error('Error updating subscription:', updateError);
        }
        
        break;
      }
      
      // ============================================
      // SUBSCRIPTION DELETED - Mark as canceled
      // ============================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        
        // Update subscription status to canceled
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (deleteError) {
          console.error('Error marking subscription as canceled:', deleteError);
        }
        
        break;
      }
      
      // ============================================
      // PAYMENT SUCCEEDED - Log payment
      // ============================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        
        // Get user ID from subscription
        if ((invoice as any).subscription) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', (invoice as any).subscription)
            .single();
          
          if (sub) {
            // Log payment in payment_history table
            await supabase
              .from('payment_history')
              .insert({
                user_id: sub.user_id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: (invoice as any).payment_intent as string,
                amount: (invoice as any).amount_paid,
                currency: (invoice as any).currency,
                status: 'succeeded',
                description: `Subscription payment for ${(invoice as any).period_start ? new Date((invoice as any).period_start * 1000).toLocaleDateString() : 'N/A'}`,
                metadata: {
                  subscription_id: (invoice as any).subscription,
                  billing_reason: (invoice as any).billing_reason,
                },
              });
          }
        }
        
        break;
      }
      
      // ============================================
      // PAYMENT FAILED - Log and notify
      // ============================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        
        // Update subscription status if needed
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
      
      // ============================================
      // DEFAULT - Log unhandled events
      // ============================================
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return success response
    return NextResponse.json({ 
      received: true,
      type: event.type,
    });
    
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Return success to prevent Stripe from retrying
    // Log the error for manual investigation
    return NextResponse.json({ 
      received: true,
      error: error.message,
    });
  }
}

// Also export GET to handle webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint. Use POST to send events.',
    configured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}