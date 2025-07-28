import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { data: user, error } = await supabase
    .from('medical')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return NextResponse.json({ 
    user, 
    error: error?.message,
    session_user_id: session.user.id 
  });
} 