# Rate Limiting Implementation Guide

## Overview

We've implemented in-memory rate limiting to protect your API endpoints from abuse and control costs, especially for expensive AI operations.

## How It Works

1. **Runs Before Everything**: The middleware executes before your unified auth guard and API routes
2. **Smart Identification**: 
   - For authenticated users: Rate limits by Supabase user ID
   - For unauthenticated requests: Rate limits by IP address
3. **No External Dependencies**: Uses in-memory storage (no Redis, no database calls)

## Current Rate Limits

### AI Endpoints (Expensive 💰)
- `/api/quick-scan`: **5 requests/minute**
- `/api/deep-dive`: **3 requests/minute**
- `/api/photo-analysis`: **5 requests/minute**
- `/api/oracle`: **10 requests/minute**

### Other Endpoints
- `/api/reports/*`: **10 requests/hour**
- `/api/auth/*`: **5 requests/15 minutes** (prevents brute force)
- `/api/timeline`: **30 requests/minute**
- `/api/history/*`: **30 requests/minute**
- Default (all others): **60 requests/minute**

## Response Headers

Every API response includes:
```
X-RateLimit-Limit: 10          # Total requests allowed
X-RateLimit-Remaining: 7       # Requests remaining
X-RateLimit-Reset: 2024-01-...  # When limit resets
X-RateLimit-Warning: Only 2...  # When < 20% remaining
```

## Rate Limited Response (429)

When rate limited, users receive:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45,
  "limit": 5,
  "window": "60 seconds",
  "reset": "2024-01-20T..."
}
```

## Testing

Run the test script:
```bash
node test-rate-limit.js
```

## Adjusting Limits

Edit `middleware.ts`:
```typescript
const RATE_LIMITS = {
  '/api/quick-scan': { requests: 5, windowMs: 60000 }, // Change these values
  // ...
}
```

## Monitoring

Watch for 429 responses in your logs:
```typescript
// In your error tracking
if (response.status === 429) {
  logRateLimitHit(user, endpoint)
}
```

## Important Notes

1. **Memory Resets on Deploy**: Rate limit counts reset when you deploy or restart
2. **Single Instance**: This works for single server instances (perfect for Vercel)
3. **Automatic Cleanup**: Old entries are cleaned up every 5 minutes

## Integration with Your App

The rate limiter:
- ✅ Works seamlessly with your unified auth guard
- ✅ Doesn't interfere with OAuth callbacks
- ✅ Skips static files and images
- ✅ Preserves all existing functionality

## Troubleshooting

**Q: I'm getting rate limited in development**
A: The limits apply to localhost too. Either increase limits for development or add an exemption for localhost.

**Q: Legitimate users are getting rate limited**
A: Check if they're behind a shared IP (office, VPN). Authenticated users get their own limits.

**Q: How do I exempt certain users?**
A: Add this to middleware.ts:
```typescript
if (session?.user?.email === 'admin@example.com') {
  return NextResponse.next() // Skip rate limiting
}
```

## Future Upgrades

When you need to scale:
1. **Phase 1** (current): In-memory rate limiting
2. **Phase 2**: Add Redis for persistence across deploys
3. **Phase 3**: Implement tiered limits (free/pro/enterprise)
4. **Phase 4**: Add distributed rate limiting for multiple instances

## Security Benefits

This implementation protects against:
- 🛡️ DDoS attacks
- 🛡️ Brute force attempts
- 🛡️ API scraping
- 🛡️ Runaway client bugs
- 🛡️ Excessive AI API costs

---

**Remember**: This is a "good enough" solution that provides immediate protection. You can always enhance it later as your needs grow.