# Google OAuth Debugging Guide

## Quick Diagnosis Checklist

### 1. Supabase Dashboard Configuration
- [ ] Go to Supabase Dashboard > Authentication > Providers
- [ ] Ensure Google is ENABLED
- [ ] Check that Client ID and Client Secret are filled in
- [ ] Verify the redirect URL is correctly set

### 2. Google Cloud Console Configuration
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select your project (or create one)
- [ ] Navigate to APIs & Services > Credentials
- [ ] Check OAuth 2.0 Client IDs configuration
- [ ] Verify Authorized redirect URIs includes:
  - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
  - Your local dev URL if testing locally

### 3. Environment Variables
Check your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Common Error Messages and Solutions

#### "Redirect URI mismatch"
**Cause**: The redirect URI in your app doesn't match what's configured in Google Cloud Console
**Solution**: 
1. Copy the exact redirect URI from the error message
2. Add it to Google Cloud Console > OAuth 2.0 Client > Authorized redirect URIs
3. Wait 5-10 minutes for changes to propagate

#### "Invalid client"
**Cause**: Client ID or Secret is incorrect in Supabase
**Solution**: 
1. Re-copy Client ID and Secret from Google Cloud Console
2. Update in Supabase Dashboard > Authentication > Providers > Google
3. Save and try again

#### "User not found" or "No medical record"
**Cause**: OAuth user doesn't have a corresponding medical record
**Solution**: Run the OAuth migration fix (see SQL below)

## SQL Commands for Debugging

### 1. Check if Google OAuth is working at Supabase level
```sql
-- See all auth attempts
SELECT 
    id,
    created_at,
    payload->>'action' as action,
    payload->>'provider' as provider,
    payload->>'status' as status,
    payload->>'error' as error
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### 2. Find Google OAuth users
```sql
-- List all Google OAuth users
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.raw_app_meta_data->>'provider' as provider,
    u.raw_user_meta_data->>'full_name' as google_name,
    m.id as has_medical_record
FROM auth.users u
LEFT JOIN public.medical m ON u.id = m.id
WHERE u.raw_app_meta_data->>'provider' = 'google'
ORDER BY u.created_at DESC;
```

### 3. Fix missing medical records for OAuth users
```sql
-- Run the migration from 20240121_fix_medical_oauth.sql
-- This will create medical records for existing OAuth users
```

## Testing OAuth Flow

### 1. Enable Console Logging
Open browser DevTools and monitor:
- Network tab for OAuth redirects
- Console for error messages

### 2. Test URLs
1. Click "Sign in with Google"
2. Check the URL it redirects to contains:
   - `client_id` parameter
   - `redirect_uri` parameter
   - `response_type=code`

### 3. Monitor Supabase Logs
In Supabase Dashboard > Logs > Auth Logs, filter by:
- Event type: "signin"
- Provider: "google"

## Code Flow Summary

1. User clicks "Sign in with Google" in `LiquidGlassLogin.tsx`
2. `handleSocialLogin('google')` is called
3. Supabase redirects to Google OAuth
4. Google redirects back to `/auth/callback`
5. `route.ts` exchanges code for session
6. Creates/updates medical record
7. Redirects to `/dashboard`
8. Middleware checks onboarding status

## Emergency Fixes

### If nothing else works:

1. **Reset Google OAuth in Supabase**:
   - Disable Google provider
   - Clear Client ID and Secret
   - Save
   - Re-enable and re-enter credentials
   - Save again

2. **Create new OAuth credentials in Google**:
   - Create new OAuth 2.0 Client ID
   - Update Supabase with new credentials

3. **Test with a different Google account**:
   - Sometimes account-specific issues occur

## Contact Points

If still having issues:
1. Check Supabase Status: https://status.supabase.com/
2. Supabase Discord: https://discord.supabase.com/
3. Check browser console for detailed error messages
4. Review auth logs in Supabase Dashboard 