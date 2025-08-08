import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client with service role for webhooks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to send user emails (implement your email service)
async function sendUserEmail(type: string, data: any) {
  // TODO: Implement email sending using your preferred service
  // Options: SendGrid, Resend, AWS SES, etc.
  console.log(`Would send ${type} email to user:`, data);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
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

  // Check for idempotency - prevent processing the same event twice
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent && existingEvent.processed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Record the event
  await supabase
    .from('webhook_events')
    .upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
      processed: false,
    });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Skip if not a subscription checkout
        if (session.mode !== 'subscription') break;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Get the price/product details
        const price = subscription.items.data[0].price;
        
        // Get the tier from database based on price ID
        const { data: tier } = await supabase
          .from('pricing_tiers')
          .select('*')
          .or(`stripe_price_id_monthly.eq.${price.id},stripe_price_id_yearly.eq.${price.id}`)
          .single();

        if (!tier) {
          console.error('No tier found for price:', price.id);
          throw new Error('Tier not found');
        }

        // Determine billing cycle
        const billingCycle = price.recurring?.interval === 'year' ? 'yearly' : 'monthly';

        // Create subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: session.metadata?.user_id || session.client_reference_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            tier_id: tier.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            billing_cycle: billingCycle,
            trial_start: subscription.trial_start 
              ? new Date(subscription.trial_start * 1000).toISOString() 
              : null,
            trial_end: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null,
          });

        if (subError) {
          console.error('Error creating subscription:', subError);
          throw subError;
        }

        // Create payment history record
        await supabase
          .from('payment_history')
          .insert({
            user_id: session.metadata?.user_id || session.client_reference_id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100, // Convert from cents
            currency: session.currency || 'usd',
            status: 'succeeded',
            payment_method: 'card', // You can get more details from payment intent if needed
            description: `Subscription to ${tier.display_name} plan`,
            metadata: {
              session_id: session.id,
              tier: tier.name,
              billing_cycle: billingCycle,
            },
          });

        // Deactivate promotional period if active
        await supabase
          .from('promotional_periods')
          .update({ is_active: false })
          .eq('user_id', session.metadata?.user_id || session.client_reference_id)
          .eq('is_active', true);

        // Send welcome email
        await sendUserEmail('subscription_created', {
          email: session.customer_email,
          tier: tier.display_name,
          billingCycle,
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the price/product details
        const price = subscription.items.data[0].price;
        
        // Get the tier from database
        const { data: tier } = await supabase
          .from('pricing_tiers')
          .select('*')
          .or(`stripe_price_id_monthly.eq.${price.id},stripe_price_id_yearly.eq.${price.id}`)
          .single();

        const billingCycle = price.recurring?.interval === 'year' ? 'yearly' : 'monthly';

        // Update subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            tier_id: tier?.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
            billing_cycle: billingCycle,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        // Send update email
        const { data: user } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (user) {
          await sendUserEmail('subscription_updated', {
            email: user.email,
            tier: tier?.display_name,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Send cancellation email
        const { data: user } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (user) {
          await sendUserEmail('subscription_canceled', {
            email: user.email,
          });
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Record successful payment
        await supabase
          .from('payment_history')
          .insert({
            user_id: invoice.metadata?.user_id,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency,
            status: 'succeeded',
            description: `Invoice payment for subscription`,
            metadata: {
              invoice_number: invoice.number,
              billing_reason: invoice.billing_reason,
            },
          });

        // Reset usage tracking for new billing period (if subscription renewal)
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .single();

          if (subscription) {
            // Delete old usage records
            await supabase
              .from('usage_tracking')
              .delete()
              .eq('subscription_id', subscription.id)
              .lt('period_end', new Date().toISOString());
          }
        }

        // Send payment receipt email
        if (invoice.customer_email) {
          await sendUserEmail('payment_succeeded', {
            email: invoice.customer_email,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency,
            invoiceUrl: invoice.hosted_invoice_url,
          });
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Record failed payment
        await supabase
          .from('payment_history')
          .insert({
            user_id: invoice.metadata?.user_id,
            stripe_invoice_id: invoice.id,
            amount: (invoice.amount_due || 0) / 100,
            currency: invoice.currency,
            status: 'failed',
            description: `Failed invoice payment`,
            metadata: {
              invoice_number: invoice.number,
              attempt_count: invoice.attempt_count,
            },
          });

        // Update subscription status
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);
        }

        // Send payment failed email
        if (invoice.customer_email) {
          await sendUserEmail('payment_failed', {
            email: invoice.customer_email,
            amount: (invoice.amount_due || 0) / 100,
            currency: invoice.currency,
            nextAttempt: invoice.next_payment_attempt 
              ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
              : null,
          });
        }

        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Send trial ending reminder (3 days before)
        const { data: user } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (user) {
          await sendUserEmail('trial_ending', {
            email: user.email,
            trialEnd: new Date(subscription.trial_end! * 1000).toLocaleDateString(),
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ 
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Record error
    await supabase
      .from('webhook_events')
      .update({ 
        error_message: error.message,
        processed: false,
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}