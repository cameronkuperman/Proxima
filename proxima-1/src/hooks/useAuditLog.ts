import { useCallback } from 'react';
import { AuditAction } from '@/lib/audit-logger';

// Client-side hook for audit logging
export function useAuditLog() {
  const logEvent = useCallback(async (
    action: AuditAction,
    metadata?: Record<string, any>
  ) => {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          metadata,
        }),
      });
    } catch (error) {
      // Fail silently - audit logging should never break the app
      console.error('[Audit Hook] Failed to log event:', error);
    }
  }, []);

  return { logEvent };
}