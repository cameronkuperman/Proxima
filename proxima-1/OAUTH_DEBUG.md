# OAuth Debug Steps

## The Issue
- Email/password signup works perfectly
- Google OAuth creates the user in Supabase
- But the session isn't being established after OAuth
- The callback URL receives no code or token parameters

## Things to Check in Supabase Dashboard

1. Go to **Authentication** → **Providers** → **Google**
2. Make sure:
   - It's enabled
   - The redirect URL is set to: `https://proxima-eight-pi.vercel.app/auth/callback`
   - NOT just `https://proxima-eight-pi.vercel.app`

## The OAuth Flow Should Be:
1. Your app → Google
2. Google → `https://ekaxwbatykostnmopnhn.supabase.co/auth/v1/callback`
3. Supabase → `https://proxima-eight-pi.vercel.app/auth/callback?code=xxx`

## Current Issue:
Step 3 is happening but without the `?code=xxx` parameter.

## Possible Solutions:

### Option 1: Check Supabase Provider Settings
In Supabase Dashboard → Authentication → Providers → Google:
- Is there a "Redirect URL" field? It should be your app's callback URL
- Is "Skip nonce checks" enabled? Try toggling it

### Option 2: Use Supabase's Built-in Auth UI
Instead of handling OAuth manually, use Supabase's auth UI component which handles all the complexity.

### Option 3: Debug the Redirect Chain
Add logging to see the full redirect chain:
1. Open Network tab
2. Preserve log
3. Try OAuth again
4. Look for ALL redirects starting from Google