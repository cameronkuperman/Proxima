import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Lazy initialization of service role client
let supabaseServiceRole: ReturnType<typeof createClient> | null = null;

function getServiceRoleClient() {
  if (!supabaseServiceRole) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      console.warn('[Audit] Missing Supabase credentials for audit logging');
      return null;
    }
    
    supabaseServiceRole = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseServiceRole;
}

export type AuditAction = 
  // Authentication Events
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE' 
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_CHANGED'
  | 'ACCOUNT_LOCKED'
  | 'OAUTH_LOGIN'
  // Medical Data Access
  | 'MEDICAL_TIMELINE_VIEWED'
  | 'AI_ANALYSIS_VIEWED'
  | 'HEALTH_DATA_EXPORTED'
  | 'DOCTOR_REPORT_GENERATED'
  // Medical Data Changes
  | 'HEALTH_ASSESSMENT_CREATED'
  | 'MEDICAL_INFO_UPDATED'
  | 'HEALTH_RECORD_DELETED'
  | 'MEDICAL_PHOTO_UPLOADED'
  // AI Usage
  | 'QUICK_SCAN_PERFORMED'
  | 'DEEP_DIVE_STARTED'
  | 'DEEP_DIVE_COMPLETED'
  | 'PHOTO_ANALYSIS_PERFORMED'
  // Account Changes
  | 'EMAIL_CHANGED'
  | 'PROFILE_UPDATED'
  | 'ACCOUNT_DELETED';

export interface AuditLogEntry {
  user_id?: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  session_id?: string;
}

/**
 * Log an audit event to the database
 * This function is designed to fail silently to avoid disrupting user operations
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const client = getServiceRoleClient();
    if (!client) {
      return; // Skip logging if no client available
    }
    
    // Don't await this - log asynchronously to avoid slowing down requests
    client
      .from('audit.logs')
      .insert({
        ...entry,
        timestamp: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          console.error('[Audit] Failed to log event:', error);
        }
      });
  } catch (error) {
    // Fail silently - audit logging should never break the app
    console.error('[Audit] Exception while logging:', error);
  }
}

/**
 * Extract client info from request
 */
export function extractClientInfo(request: NextRequest) {
  return {
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

/**
 * Log authentication events from client-side
 * To be called from API routes that handle auth
 */
export async function logAuthEvent(
  action: Extract<AuditAction, 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'PASSWORD_RESET_REQUESTED' | 'OAUTH_LOGIN'>,
  userId: string | null,
  request: NextRequest,
  metadata?: Record<string, any>
) {
  const clientInfo = extractClientInfo(request);
  
  await logAuditEvent({
    user_id: userId || undefined,
    action,
    ...clientInfo,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log medical data access events
 */
export async function logMedicalDataAccess(
  action: Extract<AuditAction, 'MEDICAL_TIMELINE_VIEWED' | 'AI_ANALYSIS_VIEWED' | 'HEALTH_DATA_EXPORTED' | 'DOCTOR_REPORT_GENERATED'>,
  userId: string,
  request: NextRequest,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, any>
) {
  const clientInfo = extractClientInfo(request);
  
  await logAuditEvent({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ...clientInfo,
    metadata,
  });
}

/**
 * Log AI usage events
 */
export async function logAIUsage(
  action: Extract<AuditAction, 'QUICK_SCAN_PERFORMED' | 'DEEP_DIVE_STARTED' | 'DEEP_DIVE_COMPLETED' | 'PHOTO_ANALYSIS_PERFORMED'>,
  userId: string,
  request: NextRequest,
  metadata: {
    body_part?: string;
    model?: string;
    session_id?: string;
    photo_count?: number;
    [key: string]: any;
  }
) {
  const clientInfo = extractClientInfo(request);
  
  await logAuditEvent({
    user_id: userId,
    action,
    resource_type: action.includes('SCAN') ? 'quick_scan' : action.includes('DIVE') ? 'deep_dive' : 'photo_analysis',
    ...clientInfo,
    metadata,
    session_id: metadata.session_id,
  });
}

/**
 * Query audit logs (for admin dashboard or user history)
 */
export async function queryAuditLogs(
  userId?: string,
  filters?: {
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  const client = getServiceRoleClient();
  if (!client) {
    return [];
  }
  
  let query = client
    .from('audit.logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (filters?.action) {
    query = query.eq('action', filters.action);
  }

  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('timestamp', filters.endDate.toISOString());
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Audit] Failed to query logs:', error);
    return [];
  }

  return data;
}

/**
 * Get user's recent activity (for security dashboard)
 */
export async function getUserRecentActivity(userId: string, limit = 10) {
  return queryAuditLogs(userId, { limit });
}

/**
 * Check for suspicious activity (e.g., multiple failed logins)
 */
export async function checkSuspiciousActivity(userId: string, ipAddress: string): Promise<boolean> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const failedLogins = await queryAuditLogs(undefined, {
    action: 'LOGIN_FAILURE',
    startDate: oneHourAgo,
  });

  // Check for multiple failed attempts from same IP or for same user
  const failedFromIp = failedLogins.filter(log => log.ip_address === ipAddress);
  const failedForUser = failedLogins.filter(log => log.user_id === userId);

  return failedFromIp.length > 5 || failedForUser.length > 3;
}