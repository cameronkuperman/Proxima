# Safe Error Handling Guide

## Overview

We've implemented a centralized error handling system that prevents sensitive data leakage while maintaining detailed server-side logging for debugging.

## What Changed

### Before (Unsafe)
```typescript
// ❌ Exposes user IDs, error details, and debug info
return NextResponse.json({ 
  error: 'Failed to fetch timeline data',
  details: error.message,        // Database error details
  user_id: user.id,             // User's actual ID
  debug: { hasQuickScans: true } // System internals
}, { status: 500 });
```

### After (Safe)
```typescript
// ✅ Clean, safe error response
return ApiErrors.databaseError(error, 'timeline query');
// Returns: { error: 'Failed to process request', code: 'DATABASE_ERROR' }
```

## How to Use

### 1. Import the Error Utils
```typescript
import { ApiErrors, createSuccessResponse } from '@/utils/api-errors';
```

### 2. Use Predefined Error Types
```typescript
// Unauthorized (401)
return ApiErrors.unauthorized('endpoint name');

// Not Found (404)
return ApiErrors.notFound('endpoint name', 'Resource');

// Bad Request (400)
return ApiErrors.badRequest('endpoint name', 'Invalid input');

// Server Error (500)
return ApiErrors.serverError(error, 'endpoint name');

// Database Error (500)
return ApiErrors.databaseError(error, 'query context');

// Validation Error (422)
return ApiErrors.validationError('endpoint name', 'Field X is required');

// Rate Limit (429)
return ApiErrors.rateLimitError('endpoint name');
```

### 3. Success Responses
```typescript
// For successful responses
return createSuccessResponse({ data: result });
```

## Benefits

1. **No Data Leaks**: User IDs, emails, and system info stay hidden
2. **Consistent Errors**: All errors follow same format
3. **Better Debugging**: Detailed logs still available server-side
4. **Client-Friendly**: Clean error messages for frontend

## Error Response Format

All errors now return:
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

## Server-Side Logging

Detailed errors are still logged with:
- Full error message and stack trace
- Context (which endpoint/operation failed)
- Timestamp
- User ID (in logs only, not response)

## Testing

Run the test script to verify no sensitive data leaks:
```bash
npx tsx src/tests/test-api-errors.ts
```

## Migration Checklist

- [x] Created centralized error handler (`/utils/api-errors.ts`)
- [x] Updated `/api/timeline/route.ts`
- [x] Updated `/api/test-user/route.ts`
- [ ] Update remaining API routes as needed
- [x] Created test script
- [x] Documentation

## Frontend Impact

**None!** The frontend already handles errors properly by checking for the `error` field. We've just removed the extra fields that weren't being used anyway.