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
        const previousAttributes = (event.data as any).previous_attributes || {};
        
        const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;
        
        const updateData: any = {
          status: subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        };
        
        // Handle cancellation status changes
        if (cancelAtPeriodEnd) {
          // Subscription is being canceled
          const cancellationDetails = (subscription as any).cancellation_details;
          
          // Use actual cancellation details from Stripe
          const reason = cancellationDetails?.reason || 
                        (subscription as any).metadata?.cancellation_reason || 
                        'cancellation_requested';
          
          const feedback = cancellationDetails?.feedback || 
                          (subscription as any).metadata?.cancellation_feedback || 
                          null;
          
          // Only update cancellation fields if they're not already set or if reason changed
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('cancellation_reason, canceled_at')
            .eq('stripe_subscription_id', subscription.id)
            .single();
          
          if (!existingSub?.canceled_at || existingSub?.cancellation_reason !== reason) {
            updateData.cancellation_reason = reason;
            updateData.cancellation_feedback = feedback;
            updateData.canceled_at = (subscription as any).canceled_at ? 
                                   new Date((subscription as any).canceled_at * 1000).toISOString() : 
                                   new Date().toISOString();
          }
        } else {
          // Subscription is active (was resumed or never canceled)
          // Clear all cancellation data
          updateData.cancellation_reason = null;
          updateData.cancellation_feedback = null;
          updateData.canceled_at = null;
        }
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);
        
        if (updateError) {
          console.error('Failed to update subscription:', updateError);
        }
        
        // Log subscription state changes
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (sub?.user_id) {
          // Check what changed
          const previousCancelState = previousAttributes?.cancel_at_period_end;
          
          if (cancelAtPeriodEnd && previousCancelState === false) {
            // New cancellation
            const cancellationDetails = (subscription as any).cancellation_details;
            await supabase
              .from('subscription_events')
              .insert({
                user_id: sub.user_id,
                event_type: 'cancellation_scheduled',
                metadata: {
                  stripe_subscription_id: subscription.id,
                  cancel_at: (subscription as any).cancel_at,
                  current_period_end: (subscription as any).current_period_end,
                  reason: cancellationDetails?.reason || 'cancellation_requested',
                  feedback: cancellationDetails?.feedback || null,
                  comment: cancellationDetails?.comment || null,
                  canceled_via: 'stripe_portal',
                },
                event_details: cancellationDetails || null,
              });
            console.log('Cancellation scheduled for user:', sub.user_id);
            
          } else if (!cancelAtPeriodEnd && previousCancelState === true) {
            // Subscription resumed
            await supabase
              .from('subscription_events')
              .insert({
                user_id: sub.user_id,
                event_type: 'subscription_resumed',
                metadata: {
                  stripe_subscription_id: subscription.id,
                  resumed_at: new Date().toISOString(),
                },
              });
            console.log('Subscription resumed for user:', sub.user_id);
          }
        }
        
        console.log('Subscription updated:', subscription.id, cancelAtPeriodEnd ? '(cancellation scheduled)' : '');
        break;
      }
      
      // Handle subscription deletion
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Extract cancellation details
        const cancellationReason = (subscription as any).cancellation_details?.reason || 
                                   (subscription as any).metadata?.cancellation_reason || 
                                   null;
        const cancellationFeedback = (subscription as any).cancellation_details?.feedback || 
                                     (subscription as any).metadata?.cancellation_feedback || 
                                     null;
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancellation_reason: cancellationReason,
            cancellation_feedback: cancellationFeedback,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        // Store cancellation event with reason if available
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (sub) {
          await supabase
            .from('subscription_events')
            .insert({
              user_id: sub.user_id,
              event_type: 'subscription_canceled',
              metadata: {
                stripe_subscription_id: subscription.id,
                cancellation_reason: cancellationReason || 'not_provided',
                cancellation_feedback: cancellationFeedback,
                cancellation_comment: (subscription as any).cancellation_details?.comment,
                canceled_at: new Date().toISOString(),
                final_period_end: (subscription as any).current_period_end,
              },
            });
        }
        
        console.log('Subscription canceled:', subscription.id);
        break;
      }
      
      // Handle successful payments
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        
        // Store payment in payment_history table
        if (invoice.customer && invoice.amount_paid > 0) {
          // Get user ID from customer
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('stripe_customer_id', invoice.customer as string)
            .single();
          
          if (profile) {
            await supabase
              .from('payment_history')
              .upsert({
                user_id: profile.user_id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: (invoice as any).payment_intent as string,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: 'succeeded',
                description: invoice.description || `Payment for ${invoice.lines.data[0]?.description || 'subscription'}`,
                invoice_pdf: (invoice as any).invoice_pdf,
                hosted_invoice_url: (invoice as any).hosted_invoice_url,
                metadata: {
                  period_start: (invoice as any).period_start,
                  period_end: (invoice as any).period_end,
                  subscription: (invoice as any).subscription,
                },
              }, {
                onConflict: 'stripe_invoice_id',
              });
            
            console.log('Payment history recorded for invoice:', invoice.id);
          }
        }
        break;
      }
      
      // Handle failed payments
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        
        // Store failed payment in payment_history
        if (invoice.customer) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('stripe_customer_id', invoice.customer as string)
            .single();
          
          if (profile) {
            await supabase
              .from('payment_history')
              .upsert({
                user_id: profile.user_id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: (invoice as any).payment_intent as string,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: 'failed',
                description: `Failed payment for ${invoice.lines.data[0]?.description || 'subscription'}`,
                metadata: {
                  failure_reason: (invoice as any).last_payment_error?.message,
                  subscription: (invoice as any).subscription,
                },
              }, {
                onConflict: 'stripe_invoice_id',
              });
          }
        }
        
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