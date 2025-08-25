import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  console.log('=== MANUAL WEBHOOK TEST ===');
  
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
    
    // Get user's subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }
    
    // Manually simulate a cancellation event
    const now = new Date().toISOString();
    
    // Update subscription to mark as canceled
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancellation_reason: 'test_manual_trigger',
        cancellation_feedback: 'Testing webhook processing',
        canceled_at: now,
        updated_at: now,
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription', details: updateError }, { status: 500 });
    }
    
    // Log event
    const { error: eventError } = await supabaseAdmin
      .from('subscription_events')
      .insert({
        user_id: user.id,
        event_type: 'test_cancellation',
        metadata: {
          triggered_by: 'manual_test',
          subscription_id: subscription.stripe_subscription_id,
          reason: 'test_manual_trigger',
        },
      });
    
    if (eventError) {
      console.error('Event error:', eventError);
    }
    
    // Fetch updated subscription
    const { data: updated } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single();
    
    return NextResponse.json({
      success: true,
      message: 'Test event processed',
      subscription: {
        before: {
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at,
          cancellation_reason: subscription.cancellation_reason,
        },
        after: {
          cancel_at_period_end: updated?.cancel_at_period_end,
          canceled_at: updated?.canceled_at,
          cancellation_reason: updated?.cancellation_reason,
        },
      },
      event_logged: !eventError,
    });
    
  } catch (error: any) {
    console.error('Test trigger error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';