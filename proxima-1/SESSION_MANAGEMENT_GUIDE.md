# Session Management Implementation Guide

## Overview

We've implemented comprehensive session management with:
- 4-hour inactivity timeout
- 7-day absolute session timeout (30 days with "Remember Me")
- Automatic activity tracking
- Clean logout with friendly messages

## How It Works

### 1. Remember Me Checkbox
On the login page, users now see:
```
☐ Remember me for 30 days
```

When checked:
- Session lasts 30 days instead of 7
- User stays logged in longer
- Still logs out after 4 hours of inactivity

### 2. Activity Tracking
The system tracks user activity automatically:
- Mouse movements
- Keyboard typing
- Scrolling
- Clicks
- Page navigation

Every activity resets the 4-hour inactivity timer.

### 3. Timeout Behavior

**Inactivity Timeout (4 hours)**:
- If user doesn't interact for 4 hours
- Automatic logout
- Message: "Your session expired due to inactivity"

**Absolute Timeout**:
- Without Remember Me: 7 days
- With Remember Me: 30 days
- Message: "Your session has expired. Please sign in again"

### 4. User Experience

**Login Flow**:
1. User enters credentials
2. Optionally checks "Remember me for 30 days"
3. Signs in
4. Session manager starts tracking

**During Use**:
- Any activity keeps session alive
- No annoying "are you still there?" popups
- Silent activity tracking

**On Timeout**:
- Automatic logout
- Redirect to login page
- Clear message explaining why

## Technical Details

### Session Storage
```javascript
localStorage keys:
- proxima_last_activity: timestamp of last activity
- proxima_session_start: when session began
- proxima_remember_me: whether remember me is active
```

### Integration Points

1. **AuthContext**: Initializes session on sign in
2. **Login Component**: Remember me checkbox
3. **Session Manager**: Handles all timing logic
4. **Activity Listeners**: Track user interactions

### Security Benefits

1. **Prevents unauthorized access** if user forgets to logout
2. **Balances security and convenience** with reasonable timeouts
3. **Clear communication** about why logout happened
4. **No session hijacking** - old sessions expire

## Testing

To verify it's working:

1. **Check Remember Me**:
   - Login with checkbox checked
   - Check browser localStorage for `proxima_remember_me: true`

2. **Test Inactivity**:
   - Login
   - Don't interact for 4 hours
   - Should auto-logout

3. **Test Activity Reset**:
   - Login
   - Wait 3 hours
   - Click something
   - Timer resets to 4 hours

## Configuration

To adjust timeouts, edit `/utils/session-manager.ts`:
```typescript
const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
const ABSOLUTE_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
const REMEMBER_ME_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days
```

## Visual Changes

The login form now shows:
- Remember me checkbox with custom styling
- Gradient checkmark when selected
- Proper spacing with forgot password link
- Session timeout messages in error area

## No Breaking Changes

- Existing users can login normally
- Remember me is optional
- All auth flows work as before
- Just adds extra security layer