import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent, AuditAction, extractClientInfo } from '@/lib/audit-logger';
import { getAuthenticatedUser } from '@/utils/auth-helpers';

// Client-side audit logging endpoint
// Only allows specific non-sensitive actions to be logged from client
const CLIENT_ALLOWED_ACTIONS: AuditAction[] = [
  'LOGOUT',
  'MEDICAL_TIMELINE_VIEWED',
  'AI_ANALYSIS_VIEWED',
  'DOCTOR_REPORT_GENERATED',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, metadata } = body;

    // Validate action is allowed from client
    if (!CLIENT_ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = getAuthenticatedUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract client info
    const clientInfo = extractClientInfo(request);

    // Log the event
    await logAuditEvent({
      user_id: user.id,
      action,
      ...clientInfo,
      metadata: {
        ...metadata,
        source: 'client',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to log audit event' },
      { status: 500 }
    );
  }
}