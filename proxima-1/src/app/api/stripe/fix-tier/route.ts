import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('=== FIX SUBSCRIPTION TIER ===');
  
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
    
    const { newTier } = await req.json();
    
    if (!newTier || !['basic', 'pro', 'pro_plus'].includes(newTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    
    // Use service role to update
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
    
    // Update the subscription tier
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ 
        tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .select();
    
    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Tier updated to ${newTier}`,
      subscription: data?.[0]
    });
    
  } catch (error: any) {
    console.error('Fix tier error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';