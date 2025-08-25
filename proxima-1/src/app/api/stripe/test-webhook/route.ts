import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('=== WEBHOOK DEBUG CHECK ===');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    // 1. Check recent webhook events
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Recent webhook events:', webhookEvents?.length || 0);
    
    // 2. Check subscription status
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    const sub = subscriptions?.[0];
    console.log('Latest subscription status:', {
      status: sub?.status,
      cancel_at_period_end: sub?.cancel_at_period_end,
      canceled_at: sub?.canceled_at,
      cancellation_reason: sub?.cancellation_reason,
      updated_at: sub?.updated_at,
    });
    
    // 3. Check subscription events
    const { data: subEvents, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Recent subscription events:', subEvents?.map(e => ({
      type: e.event_type,
      created: e.created_at,
      metadata: e.metadata,
    })));
    
    // 4. Check if webhook secret is configured
    const webhookSecretExists = !!process.env.STRIPE_WEBHOOK_SECRET;
    console.log('Webhook secret configured:', webhookSecretExists);
    
    return NextResponse.json({
      webhook_events: {
        count: webhookEvents?.length || 0,
        recent: webhookEvents?.map(e => ({
          id: e.stripe_event_id,
          processed: e.processed,
          created: e.created_at,
        })),
      },
      subscription: {
        status: sub?.status,
        cancel_at_period_end: sub?.cancel_at_period_end,
        canceled_at: sub?.canceled_at,
        cancellation_reason: sub?.cancellation_reason,
        updated_at: sub?.updated_at,
      },
      subscription_events: {
        count: subEvents?.length || 0,
        recent: subEvents?.map(e => ({
          type: e.event_type,
          created: e.created_at,
        })),
      },
      config: {
        webhook_secret_configured: webhookSecretExists,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`,
      },
      debug_info: {
        message: 'Check Stripe Dashboard webhook logs for delivery status',
        check_webhook_endpoint: 'https://dashboard.stripe.com/test/webhooks',
      },
    });
    
  } catch (error: any) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';