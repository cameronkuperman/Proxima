# 🚀 Production Deployment Checklist

## Critical Changes Required Before Production

### 1. Update CORS Domain in `next.config.ts`

**Location**: Line 93 in `next.config.ts`

**Current**:
```javascript
value: process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com' // Update this with your actual domain
  : 'http://localhost:3000'
```

**Change to** (your actual Vercel domain):
```javascript
value: process.env.NODE_ENV === 'production' 
  ? 'https://proxima-health.vercel.app' // Or your custom domain
  : 'http://localhost:3000'
```

### 2. Environment Variables in Vercel

You need to add these environment variables in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ekaxwbatykostnmopnhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (your full key)
NEXT_PUBLIC_ORACLE_API_URL=https://web-production-945c4.up.railway.app
```

⚠️ **DO NOT** add `GEMINI_API_KEY` to Vercel - keep it server-side only!

### 3. Update Content Security Policy (if using custom domain)

If you're using a custom domain like `proxima-health.com`, you might need to update the CSP in `next.config.ts`:

**Add your domain to connect-src** (around line 38-44):
```javascript
connect-src 'self' 
  https://*.supabase.co 
  wss://*.supabase.co 
  https://web-production-945c4.up.railway.app 
  https://proxima-health.com // Add your custom domain if needed
  https://*.vercel.app // Already works for Vercel domains
```

### 4. OAuth Redirect URLs

If you're using Google OAuth, update in Google Cloud Console:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://ekaxwbatykostnmopnhn.supabase.co/auth/v1/callback
   ```

### 5. Supabase Configuration

In your Supabase dashboard:
1. Go to Authentication → URL Configuration
2. Add your production URL to "Site URL":
   ```
   https://proxima-health.vercel.app
   ```
   or your custom domain

### 6. Backend API Configuration (CRITICAL - CORS)

Your Railway backend (Oracle API) MUST be configured to allow CORS from your production domain:

**Backend developer needs to add these allowed origins:**
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",              # Development
    "https://proxima-health.vercel.app",  # Your Vercel domain
    "https://your-custom-domain.com"      # If using custom domain
]
```

**Backend must send these headers:**
```
Access-Control-Allow-Origin: https://proxima-health.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

⚠️ **Without this, your frontend CANNOT communicate with the backend API!**

## Quick Copy-Paste Summary

Replace this in `next.config.ts` (line 93):
```javascript
'https://your-production-domain.com'
```

With:
```javascript
'https://proxima-health.vercel.app' // Or your custom domain
```

### 7. Production Configuration for API URLs

**Critical**: Set up proper production API endpoints

1. **Environment Variables**:
   - Ensure all API URLs use HTTPS in production
   - Never expose development/localhost URLs in production build
   - Use environment-specific configuration

2. **Backend Security**:
   - Ensure backend validates all incoming requests
   - Backend should have its own rate limiting
   - Backend should sanitize all responses

3. **API Key Management**:
   - Store all API keys securely (server-side only)
   - Rotate API keys regularly
   - Monitor API key usage

## Testing After Deployment

1. **Check Security Headers**:
   ```bash
   curl -I https://your-domain.vercel.app
   ```

2. **Test Features**:
   - [ ] Login/Signup works
   - [ ] BioDigital 3D viewer loads
   - [ ] API calls to backend work
   - [ ] Photo upload works
   - [ ] Rate limiting works (try spamming an endpoint)

3. **Check Browser Console**:
   - No CSP violations
   - No CORS errors
   - No blocked resources

## Common Issues & Fixes

**CORS Error on API calls**:
- Make sure your backend allows your production domain
- Check that `NEXT_PUBLIC_ORACLE_API_URL` is set in Vercel

**OAuth not working**:
- Verify redirect URLs in Google Cloud Console
- Check Supabase URL configuration

**BioDigital not loading**:
- Should work automatically (it's already in CSP)
- Check browser console for specific errors

---

**That's it!** Just update the domain in one place and add your environment variables to Vercel.