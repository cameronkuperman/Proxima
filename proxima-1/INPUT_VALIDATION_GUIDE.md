# Input Validation Implementation Guide

## Overview

We've implemented input validation using Zod to protect against:
- SQL injection
- XSS attacks
- Invalid data types
- Out-of-range values
- Malformed requests

## What's Protected

### Timeline API (`/api/timeline`)

**GET Parameters:**
- `limit`: Must be 1-100 (default: 50)
- `offset`: Must be >= 0 (default: 0)
- `search`: Max 200 characters (trimmed)
- `type`: Max 50 characters (trimmed)

**POST Body:**
- `interactionId`: Must be valid UUID
- `interactionType`: Must be one of:
  - `quick_scan`
  - `deep_dive`
  - `photo_analysis`
  - `report`
  - `oracle_chat`
  - `tracking_log`

## How It Works

1. **Request arrives** at API endpoint
2. **Validation runs** before any processing
3. **Invalid requests** get clean 400 error
4. **Valid requests** continue normally

## Example Responses

### Valid Request
```bash
GET /api/timeline?limit=20&offset=0
# Continues to normal processing
```

### Invalid Request
```bash
GET /api/timeline?limit=200
# Returns: 400 Bad Request
{
  "error": "limit: Number must be less than or equal to 100",
  "code": "BAD_REQUEST"
}
```

### SQL Injection Blocked
```bash
POST /api/timeline
{
  "interactionId": "123e4567-e89b-12d3-a456-426614174000",
  "interactionType": "quick_scan'; DROP TABLE users; --"
}
# Returns: 400 Bad Request
{
  "error": "interactionType: Invalid enum value",
  "code": "BAD_REQUEST"
}
```

## Adding Validation to New Endpoints

1. **Create Schema** in `/utils/validation-schemas.ts`:
```typescript
export const myEndpointSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
  email: z.string().email()
});
```

2. **Use in Route**:
```typescript
import { validateRequest, myEndpointSchema } from '@/utils/validation-schemas';

export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateRequest(myEndpointSchema, body);
  
  if (!validation.success) {
    return ApiErrors.badRequest('endpoint name', validation.error);
  }
  
  const { name, age, email } = validation.data;
  // Continue with validated data...
}
```

## Benefits

1. **Type Safety**: TypeScript knows the exact types after validation
2. **Consistent Errors**: All validation errors follow same format
3. **No Breaking Changes**: Invalid data rejected, valid data unchanged
4. **Security**: Blocks injection attacks automatically
5. **Performance**: Validation is extremely fast

## Testing

Run validation tests:
```bash
npx tsx src/tests/test-input-validation.ts
```

## Common Patterns

### Optional with Default
```typescript
limit: z.string().optional().default('50')
```

### Transform String to Number
```typescript
limit: z.string()
  .transform(val => parseInt(val))
  .pipe(z.number().min(1).max(100))
```

### Enum Values
```typescript
status: z.enum(['active', 'inactive', 'pending'])
```

### UUID Validation
```typescript
id: z.string().uuid()
```

### Trim and Length
```typescript
search: z.string()
  .transform(val => val.trim())
  .pipe(z.string().max(200))
```

## No Frontend Changes Needed

The frontend already sends valid data, so this validation:
- ✅ Protects against malicious requests
- ✅ Doesn't affect normal users
- ✅ Maintains same API behavior
- ✅ Just adds security layer