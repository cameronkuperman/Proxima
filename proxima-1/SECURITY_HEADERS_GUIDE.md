# Security Headers Implementation Guide

## Overview

We've implemented essential security headers to protect your application from common web vulnerabilities while ensuring all features work correctly.

## Headers Implemented

### 1. X-Frame-Options: SAMEORIGIN
- **Purpose**: Prevents clickjacking attacks
- **Effect**: Only your own site can iframe your content
- **Note**: BioDigital uses its own iframe, not yours, so this doesn't affect it

### 2. X-Content-Type-Options: nosniff
- **Purpose**: Prevents MIME type sniffing attacks
- **Effect**: Browser trusts your Content-Type headers
- **Impact**: None - just security improvement

### 3. Referrer-Policy: strict-origin-when-cross-origin
- **Purpose**: Controls information sent to other sites
- **Effect**: Only sends domain (not full URL) to external sites
- **Benefit**: Protects user privacy and sensitive URLs

### 4. Permissions-Policy
- **Purpose**: Disables unused browser features
- **Effect**: Blocks access to camera, microphone, geolocation
- **Note**: You're not using these features anyway

### 5. Strict-Transport-Security (Production Only)
- **Purpose**: Forces HTTPS connections
- **Effect**: Browser remembers to use HTTPS for 1 year
- **⚠️ WARNING**: Only enabled in production to avoid dev issues

### 6. Content-Security-Policy (CSP)
Our CSP specifically allows:
- ✅ Your own scripts and styles
- ✅ Inline scripts/styles (needed for Next.js)
- ✅ BioDigital iframe and scripts
- ✅ Supabase connections (including WebSocket)
- ✅ Your backend API (Railway)
- ✅ Images from anywhere (for photo analysis)
- ✅ Local development (localhost:8000)

## CORS Headers (API Routes Only)

For `/api/*` routes, we add CORS headers to allow:
- Credentials (cookies)
- All common HTTP methods
- Authorization headers
- **TODO**: Update `Access-Control-Allow-Origin` with your production domain

## Testing

Run the test script:
```bash
node test-security-headers.js
```

This will show you which headers are active.

## What This Protects Against

1. **Clickjacking**: Can't embed your site in malicious iframes
2. **XSS Attacks**: Limits where scripts can load from
3. **Data Injection**: Can't inject forms that submit elsewhere
4. **MIME Confusion**: Can't trick browser with wrong file types
5. **Protocol Downgrade**: Forces HTTPS in production
6. **Privacy Leaks**: Limits referrer information

## Compatibility Verified

- ✅ **Next.js**: Allows necessary inline scripts
- ✅ **BioDigital**: Explicitly allowed in CSP
- ✅ **Supabase**: All endpoints and WebSocket connections allowed
- ✅ **Backend API**: Railway domain allowed
- ✅ **Development**: Localhost connections work
- ✅ **Photo Upload**: Blob and data URLs allowed

## If Something Breaks

1. **Check browser console** for CSP violations
2. **Look for** "Refused to load..." or "Refused to execute..." errors
3. **Common fixes**:
   - Add domain to `connect-src` for API calls
   - Add domain to `frame-src` for iframes
   - Add domain to `script-src` for external scripts

## Monitoring

Watch for:
- CSP violation reports in browser console
- 403/blocked requests in network tab
- Any features that stop working after deployment

## Future Improvements

When you're ready for stricter security:
1. Remove `'unsafe-inline'` and use nonces
2. Remove `'unsafe-eval'` if not using it
3. Add CSP reporting endpoint
4. Implement Subresource Integrity (SRI)
5. Add more specific source lists

---

**Remember**: These headers significantly improve security without breaking any functionality. They're production-ready!