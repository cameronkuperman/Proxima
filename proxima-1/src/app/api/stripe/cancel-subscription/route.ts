import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('=== CANCEL SUBSCRIPTION ===');
  
  try {
    // Get auth token
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
    
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get optional cancellation data
    const body = await req.json();
    const { reason, feedback, action = 'cancel' } = body;
    
    // Use service role
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
    
    // Get subscription from database
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    // Handle different actions
    if (action === 'resume') {
      // Resume a canceled subscription
      if (!subscription.cancel_at_period_end) {
        return NextResponse.json(
          { error: 'Subscription is not scheduled for cancellation' },
          { status: 400 }
        );
      }
      
      // Resume the subscription in Stripe
      const updatedSubscription = await stripe().subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: false,
        }
      );
      
      // Update database
      await supabaseAdmin
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
      
      // Log the action
      await supabaseAdmin
        .from('subscription_events')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          event_type: 'resumed',
          metadata: { reason: 'user_resumed' },
        });
      
      return NextResponse.json({
        success: true,
        message: 'Subscription resumed successfully',
        subscription: {
          ...subscription,
          cancel_at_period_end: false,
        },
      });
      
    } else if (action === 'cancel') {
      // Cancel at period end (most common)
      if (subscription.cancel_at_period_end) {
        return NextResponse.json(
          { error: 'Subscription is already scheduled for cancellation' },
          { status: 400 }
        );
      }
      
      // Cancel the subscription in Stripe (at period end) with cancellation reason
      const canceledSubscription = await stripe().subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            ...((await stripe().subscriptions.retrieve(subscription.stripe_subscription_id)).metadata || {}),
            cancellation_reason: reason || 'not_specified',
            cancellation_feedback: feedback || '',
          },
        }
      );
      
      // Update database
      await supabaseAdmin
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
      
      // Log cancellation with reason
      await supabaseAdmin
        .from('subscription_events')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          event_type: 'canceled',
          metadata: {
            reason: reason || 'not_specified',
            feedback: feedback || null,
            canceled_at: new Date().toISOString(),
            effective_date: subscription.current_period_end,
          },
        });
      
      return NextResponse.json({
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period',
        cancel_date: subscription.current_period_end,
        subscription: {
          ...subscription,
          cancel_at_period_end: true,
        },
      });
      
    } else if (action === 'cancel_immediately') {
      // Cancel immediately (less common, usually for refunds)
      const canceledSubscription = await stripe().subscriptions.cancel(
        subscription.stripe_subscription_id
      );
      
      // Update database
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
      
      // Log immediate cancellation
      await supabaseAdmin
        .from('subscription_events')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          event_type: 'canceled_immediately',
          metadata: {
            reason: reason || 'not_specified',
            feedback: feedback || null,
            canceled_at: new Date().toISOString(),
          },
        });
      
      return NextResponse.json({
        success: true,
        message: 'Subscription canceled immediately',
        subscription: {
          ...subscription,
          status: 'canceled',
        },
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "cancel", "resume", or "cancel_immediately"' },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';