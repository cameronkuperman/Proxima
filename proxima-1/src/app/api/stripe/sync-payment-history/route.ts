import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('=== SYNC PAYMENT HISTORY ===');
  
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
    
    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ 
        success: false,
        message: 'No Stripe customer found',
        synced: 0 
      });
    }
    
    // Get all invoices from Stripe
    const invoices = await stripe().invoices.list({
      customer: profile.stripe_customer_id,
      limit: 100, // Get more historical data
    });
    
    console.log(`Found ${invoices.data.length} invoices for customer ${profile.stripe_customer_id}`);
    
    let syncedCount = 0;
    let errors = [];
    
    // Sync each invoice to our database
    for (const invoice of invoices.data) {
      try {
        // Only sync paid invoices
        if (invoice.status === 'paid' && invoice.amount_paid > 0) {
          const { error } = await supabaseAdmin
            .from('payment_history')
            .upsert({
              user_id: user.id,
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
                number: invoice.number,
                created: (invoice as any).created,
              },
              created_at: new Date((invoice as any).created * 1000).toISOString(),
            }, {
              onConflict: 'stripe_invoice_id',
            });
          
          if (error) {
            console.error(`Error syncing invoice ${invoice.id}:`, error);
            errors.push({ invoice: invoice.id, error: error.message });
          } else {
            syncedCount++;
          }
        }
      } catch (err: any) {
        console.error(`Error processing invoice ${invoice.id}:`, err);
        errors.push({ invoice: invoice.id, error: err.message });
      }
    }
    
    console.log(`Successfully synced ${syncedCount} payments`);
    
    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} payment(s)`,
      total: invoices.data.length,
      synced: syncedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error: any) {
    console.error('Sync payment history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';