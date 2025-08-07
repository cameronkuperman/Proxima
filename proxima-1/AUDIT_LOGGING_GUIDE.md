# Audit Logging Implementation Guide

## Overview

Proxima-1 now has comprehensive audit logging to track critical security events and user actions. This system helps with:
- Security investigations
- Compliance requirements (healthcare privacy standards, GDPR)
- Debugging user issues
- Usage analytics

## Architecture

### Database Schema

```sql
-- Located in audit schema for better organization
audit.logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  action TEXT (enum validated),
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ
)
```

### Logged Events

#### Authentication Events
- `LOGIN_SUCCESS` - Successful login with email/password
- `LOGIN_FAILURE` - Failed login attempt
- `LOGOUT` - User logout
- `PASSWORD_RESET_REQUESTED` - Password reset initiated
- `PASSWORD_CHANGED` - Password successfully changed
- `ACCOUNT_LOCKED` - Account locked due to failed attempts
- `OAUTH_LOGIN` - OAuth provider login (Google/Apple)

#### Medical Data Access
- `MEDICAL_TIMELINE_VIEWED` - User viewed their health timeline
- `AI_ANALYSIS_VIEWED` - User viewed AI analysis results
- `HEALTH_DATA_EXPORTED` - User exported their health data
- `DOCTOR_REPORT_GENERATED` - Medical report generated for doctor

#### Medical Data Changes
- `HEALTH_ASSESSMENT_CREATED` - New health assessment created
- `MEDICAL_INFO_UPDATED` - Medical information updated
- `HEALTH_RECORD_DELETED` - Health record deleted
- `MEDICAL_PHOTO_UPLOADED` - Medical photos uploaded

#### AI Usage
- `QUICK_SCAN_PERFORMED` - Quick scan AI analysis
- `DEEP_DIVE_STARTED` - Deep dive analysis initiated
- `DEEP_DIVE_COMPLETED` - Deep dive analysis completed
- `PHOTO_ANALYSIS_PERFORMED` - Photo analysis completed

#### Account Changes
- `EMAIL_CHANGED` - Email address changed
- `PROFILE_UPDATED` - Profile information updated
- `ACCOUNT_DELETED` - Account deleted

## Implementation Details

### Server-Side Logging

Use the audit logger functions in API routes:

```typescript
import { logAuthEvent, logMedicalDataAccess, logAIUsage } from '@/lib/audit-logger';

// In an API route
export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  
  // ... perform operation ...
  
  // Log the access
  await logMedicalDataAccess(
    'MEDICAL_TIMELINE_VIEWED',
    user.id,
    request,
    'timeline',
    undefined,
    { records_count: 10 }
  );
}
```

### Client-Side Logging

Use the `useAuditLog` hook in React components:

```typescript
import { useAuditLog } from '@/hooks/useAuditLog';

function MyComponent() {
  const { logEvent } = useAuditLog();
  
  const handleViewReport = async () => {
    // ... show report ...
    
    // Log the event
    await logEvent('DOCTOR_REPORT_GENERATED', {
      report_id: 'abc123',
      report_type: 'comprehensive'
    });
  };
}
```

### Important Notes

1. **Async Logging**: All logging is async and non-blocking
2. **Fail-Safe**: Logging errors never break the application
3. **Write-Only**: Audit logs cannot be updated or deleted (integrity)
4. **Auto-Cleanup**: Logs older than 1 year are automatically removed
5. **Privacy**: Don't log sensitive medical data, only metadata

## Security Features

- **Row Level Security**: Users can only view their own logs
- **Service Role Access**: Only service role can insert logs
- **IP Tracking**: Captures IP addresses for security analysis
- **User Agent**: Tracks device/browser information
- **Immutable**: Logs cannot be modified after creation

## Querying Audit Logs

### Get User Activity

```typescript
import { getUserRecentActivity } from '@/lib/audit-logger';

const recentActivity = await getUserRecentActivity(userId, 20);
```

### Check Suspicious Activity

```typescript
import { checkSuspiciousActivity } from '@/lib/audit-logger';

const isSuspicious = await checkSuspiciousActivity(userId, ipAddress);
if (isSuspicious) {
  // Take security action
}
```

### Custom Queries

```typescript
import { queryAuditLogs } from '@/lib/audit-logger';

const failedLogins = await queryAuditLogs(userId, {
  action: 'LOGIN_FAILURE',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  limit: 10
});
```

## Compliance Considerations

1. **Retention**: Currently set to 1 year, adjust based on requirements
2. **Access Control**: Implement admin dashboard for security team
3. **Export**: Build export functionality for compliance audits
4. **Anonymization**: Consider anonymizing old logs instead of deletion

## Future Enhancements

1. **Real-time Alerts**: Alert on suspicious patterns
2. **Analytics Dashboard**: Visualize usage patterns
3. **Batch Export**: Export logs for external analysis
4. **Advanced Queries**: More sophisticated filtering options
5. **Tiered Storage**: Move old logs to cheaper storage

## Troubleshooting

### Logs Not Appearing

1. Check Supabase service role key is configured
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure middleware is not blocking requests

### Performance Issues

1. Indexes are already created on common query fields
2. Consider archiving old logs
3. Use pagination for large queries
4. Implement caching for frequent queries

## Migration Instructions

To apply the audit logging schema to your Supabase instance:

1. Run the migration file: `supabase/migrations/create_audit_logs.sql`
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in environment
3. Deploy the updated API routes and components
4. Test with a few manual actions to verify logging

## Testing

Test audit logging is working:

```bash
# Check recent logins
SELECT * FROM audit.logs 
WHERE action = 'LOGIN_SUCCESS' 
ORDER BY created_at DESC 
LIMIT 10;

# Check AI usage
SELECT action, COUNT(*) 
FROM audit.logs 
WHERE action LIKE '%_SCAN_%' OR action LIKE '%_DIVE_%'
GROUP BY action;
```