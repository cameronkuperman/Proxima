import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { ApiErrors, createSuccessResponse } from '@/utils/api-errors';

export async function GET() {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return ApiErrors.unauthorized('test-user GET');
  }
  
  const { data: user, error } = await supabase
    .from('medical')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    return ApiErrors.databaseError(error, 'test-user query');
  }
  
  // Only return the user data, no session info or error details
  return createSuccessResponse({ user });
} 