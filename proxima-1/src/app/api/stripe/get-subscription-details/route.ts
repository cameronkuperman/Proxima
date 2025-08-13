import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('=== GET SUBSCRIPTION DETAILS ===');
  
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
    
    // Use service role to get subscription data
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
      .in('status', ['active', 'trialing', 'past_due', 'canceled'])
      .maybeSingle();
    
    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        tier: 'free',
        status: 'no_subscription',
        message: 'No active subscription found'
      });
    }
    
    // Get user profile for Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    let stripeData: any = null;
    let invoices: any[] = [];
    let upcomingInvoice: any = null;
    
    if (profile?.stripe_customer_id && subscription.stripe_subscription_id) {
      try {
        // Get full subscription details from Stripe
        const stripeSubscription = await stripe().subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
        
        stripeData = {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: (stripeSubscription as any).cancel_at_period_end,
          cancel_at: (stripeSubscription as any).cancel_at ? new Date((stripeSubscription as any).cancel_at * 1000).toISOString() : null,
          canceled_at: (stripeSubscription as any).canceled_at ? new Date((stripeSubscription as any).canceled_at * 1000).toISOString() : null,
          trial_end: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000).toISOString() : null,
        };
        
        // Get recent invoices
        const invoiceList = await stripe().invoices.list({
          customer: profile.stripe_customer_id,
          limit: 5,
        });
        
        invoices = invoiceList.data.map(inv => ({
          id: inv.id,
          number: inv.number,
          amount: inv.amount_paid / 100, // Convert from cents
          currency: inv.currency,
          status: inv.status,
          created: new Date((inv as any).created * 1000).toISOString(),
          pdf_url: inv.hosted_invoice_url,
          invoice_pdf: inv.invoice_pdf,
        }));
        
        // Get upcoming invoice (shows next charge)
        try {
          const upcoming = await (stripe().invoices as any).retrieveUpcoming({
            customer: profile.stripe_customer_id,
          });
          
          upcomingInvoice = {
            amount: upcoming.amount_due / 100,
            currency: upcoming.currency,
            date: new Date((upcoming as any).period_end * 1000).toISOString(),
          };
        } catch (e) {
          // No upcoming invoice (might be canceled)
          console.log('No upcoming invoice');
        }
        
      } catch (stripeError: any) {
        console.error('Stripe API error:', stripeError.message);
      }
    }
    
    // Get feature limits based on tier
    const featureLimits = getFeatureLimits(subscription.tier);
    
    // Get current usage (you'll need to implement usage tracking)
    const usage = await getUsageStats(user.id, supabaseAdmin);
    
    return NextResponse.json({
      subscription: {
        ...subscription,
        stripe_data: stripeData,
      },
      tier: subscription.tier,
      status: subscription.status,
      features: featureLimits,
      usage: usage,
      invoices: invoices,
      upcoming_invoice: upcomingInvoice,
      can_cancel: subscription.status === 'active' && !subscription.cancel_at_period_end,
      can_resume: subscription.status === 'active' && subscription.cancel_at_period_end,
    });
    
  } catch (error: any) {
    console.error('Get subscription details error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function getFeatureLimits(tier: string) {
  const limits = {
    free: {
      oracle_chats: 5,
      quick_scans: 3,
      deep_dives: 0,
      photo_analyses: 2,
      report_generations: 1,
      storage_gb: 0.5,
    },
    basic: {
      oracle_chats: 50,
      quick_scans: 30,
      deep_dives: 5,
      photo_analyses: 20,
      report_generations: 10,
      storage_gb: 5,
    },
    pro: {
      oracle_chats: -1, // unlimited
      quick_scans: -1,
      deep_dives: 30,
      photo_analyses: 100,
      report_generations: 50,
      storage_gb: 25,
    },
    pro_plus: {
      oracle_chats: -1,
      quick_scans: -1,
      deep_dives: -1,
      photo_analyses: -1,
      report_generations: -1,
      storage_gb: 100,
    },
  };
  
  return limits[tier as keyof typeof limits] || limits.free;
}

async function getUsageStats(userId: string, supabase: any) {
  // This is a placeholder - you'll need to implement actual usage tracking
  // by counting records in your various tables
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    // Count oracle chats this month
    const { count: oracleChats } = await supabase
      .from('oracle_chats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    
    // Count quick scans this month
    const { count: quickScans } = await supabase
      .from('health_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('assessment_type', 'quick_scan')
      .gte('created_at', startOfMonth.toISOString());
    
    // Count deep dives this month
    const { count: deepDives } = await supabase
      .from('health_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('assessment_type', 'deep_dive')
      .gte('created_at', startOfMonth.toISOString());
    
    // Count photo analyses this month
    const { count: photoAnalyses } = await supabase
      .from('photo_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    
    // Count report generations this month
    const { count: reports } = await supabase
      .from('generated_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    
    return {
      oracle_chats: oracleChats || 0,
      quick_scans: quickScans || 0,
      deep_dives: deepDives || 0,
      photo_analyses: photoAnalyses || 0,
      report_generations: reports || 0,
      storage_gb: 0.1, // Placeholder - implement actual storage calculation
      period_start: startOfMonth.toISOString(),
      period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      oracle_chats: 0,
      quick_scans: 0,
      deep_dives: 0,
      photo_analyses: 0,
      report_generations: 0,
      storage_gb: 0,
      period_start: startOfMonth.toISOString(),
      period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    };
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';