import { NextRequest, NextResponse } from 'next/server';
import { logAuthEvent } from '@/lib/audit-logger';
import { getAuthenticatedUser } from '@/utils/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get user before logout
    const user = getAuthenticatedUser(request);
    
    if (user?.id) {
      // Log logout event
      await logAuthEvent(
        'LOGOUT',
        user.id,
        request,
        {
          email: user.email,
        }
      );
    }

    // Note: Actual logout is handled by Supabase on client side
    // This endpoint is just for audit logging

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth Logout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to log logout' },
      { status: 500 }
    );
  }
}