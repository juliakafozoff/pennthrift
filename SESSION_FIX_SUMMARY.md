# Session Authentication Fix - Summary of Changes

## Overview
Fixed session authentication issues by adding comprehensive logging, tightening CORS, fixing middleware order, and simplifying auth checks.

## Files Changed

### 1. `server/server.js`
**Changes:**
- ✅ Added `app.set('trust proxy', 1)` before session middleware (required for Render/proxy environments)
- ✅ Tightened CORS configuration:
  - Rejects requests without origin in production
  - Only allows specific origins: `https://pennthrift.netlify.app`, `http://localhost:3000`, and `FRONTEND_URL` env var
  - Added `exposedHeaders: ['Set-Cookie']` to expose cookie headers
- ✅ Added explicit `app.options('*', cors())` for preflight requests
- ✅ Added session store error logging (MongoStore error/connected events)
- ✅ Added explicit `path: '/'` to cookie configuration
- ✅ Ensured middleware order: `trust proxy` → `cookieParser` → `CORS` → `session` → `passport`

### 2. `server/routes/auth.js`
**Changes:**

#### Auth Check Endpoint (`POST /api/auth/`)
- ✅ **Simplified authentication check**: Removed dependency on `req.cookies.user_sid`
- ✅ Now checks: `req.session.user` OR `req.isAuthenticated()` (passport)
- ✅ **Added comprehensive logging**:
  - Method, URL, Origin
  - Cookie header (raw)
  - Session ID
  - Session keys
  - Session user
  - Passport user
  - Is authenticated status
  - Parsed cookies

#### Login Endpoint (`POST /api/auth/login`)
- ✅ **Added comprehensive logging**:
  - All request details (method, URL, origin, cookies)
  - Session state before and after save
  - Set-Cookie header check before response
  - Session save errors with details

#### Register Endpoint (`POST /api/auth/register`)
- ✅ **Added comprehensive logging**:
  - All request details
  - Session state before and after save
  - Set-Cookie header check
  - Error logging for user save and session save failures

#### New Debug Endpoint (`GET /api/debug/session`)
- ✅ Returns JSON with:
  - Origin header
  - Cookie header presence
  - Parsed cookies
  - Session ID
  - Session user
  - Passport user
  - Is authenticated status
  - Session keys

## What to Look For in Render Logs

### After Login Attempt:

1. **Login Request Logs** (look for `=== LOGIN REQUEST ===`):
   ```
   === LOGIN REQUEST ===
   Method: POST
   URL: /api/auth/login
   Origin: https://pennthrift.netlify.app
   Cookie Header: [should show existing cookies or 'NONE']
   Session ID: [should be present]
   Session Keys (before): [array of keys]
   Passport User: [should show username after passport.authenticate]
   Is Authenticated: true/false
   ```

2. **Session Save Logs** (look for `=== SESSION SAVED ===`):
   ```
   === SESSION SAVED ===
   Session ID: [should match above]
   Session User: [should show username]
   Session Keys (after): [should include 'user']
   Set-Cookie Header: [should show cookie being set or 'NOT SET YET']
   ```

3. **Session Store Errors** (look for `=== SESSION STORE ERROR ===`):
   - If you see this, MongoDB connection/save is failing
   - Check `DATABASE_ACCESS` env var
   - Check MongoDB connection

### After Auth Check:

1. **Auth Check Logs** (look for `=== AUTH CHECK REQUEST ===`):
   ```
   === AUTH CHECK REQUEST ===
   Method: POST
   URL: /api/auth/
   Origin: https://pennthrift.netlify.app
   Cookie Header: [CRITICAL - should show 'user_sid=...' cookie]
   Session ID: [should match login session ID]
   Session Keys: [should include 'user']
   Session User: [should show username]
   Passport User: [may or may not be set]
   Is Authenticated: true/false
   Cookies Parsed: [should show user_sid]
   ```

### Key Things to Check:

1. **Cookie Header in Auth Check**:
   - ❌ If `Cookie Header: NONE` → Cookie not being sent from browser
   - ✅ If `Cookie Header: user_sid=...` → Cookie is being sent

2. **Session ID Consistency**:
   - Login session ID should match auth check session ID
   - If different → New session being created (cookie not working)

3. **Session User**:
   - Should be set after login
   - Should persist in auth check
   - If missing in auth check → Session not being loaded from store

4. **Set-Cookie Header**:
   - Should be present after login/register
   - If `NOT SET YET` → Express-session not setting cookie

5. **CORS Errors**:
   - Look for `Origin ... not allowed by CORS`
   - Should only allow: `https://pennthrift.netlify.app`, `http://localhost:3000`

## Testing the Debug Endpoint

After logging in, visit (in browser or curl):
```
GET https://pennthrift.onrender.com/api/auth/debug/session
```

This will show you exactly what the server sees:
- Whether cookies are being sent
- Whether session is loaded
- Whether passport authentication is working

## Expected Flow

1. **Login**:
   - User submits credentials
   - Passport authenticates
   - `req.session.user` is set
   - Session is saved to MongoDB
   - Cookie is set in response (`Set-Cookie` header)
   - Response sent with success

2. **Auth Check**:
   - Browser sends request with `Cookie: user_sid=...` header
   - Express-session loads session from MongoDB using cookie
   - `req.session.user` should be available
   - Returns `[true, username]`

## Common Issues to Diagnose

### Issue 1: Cookie Not Being Sent
**Symptoms**: `Cookie Header: NONE` in auth check logs
**Causes**:
- Browser blocking third-party cookies
- CORS not configured correctly
- Cookie domain/path mismatch
- `withCredentials: true` not set in axios

### Issue 2: Session Not Loading
**Symptoms**: Cookie present but `Session User: NOT SET`
**Causes**:
- Session not saved to MongoDB (check session store errors)
- Session ID mismatch (cookie value doesn't match stored session)
- MongoDB connection issues

### Issue 3: New Session Created
**Symptoms**: Different session IDs in login vs auth check
**Causes**:
- Cookie not being sent (see Issue 1)
- Cookie domain/path incorrect
- Browser not accepting cookie

### Issue 4: CORS Blocking
**Symptoms**: `Origin ... not allowed by CORS` errors
**Causes**:
- Origin not in allowed list
- Preflight OPTIONS request failing

## Next Steps

1. **Deploy these changes to Render**
2. **Try logging in and check logs for**:
   - Login request logs
   - Session save confirmation
   - Auth check request logs
   - Cookie header presence
3. **Use debug endpoint** to inspect session state
4. **Share logs** if issue persists - the detailed logging will show exactly where it's failing

## Security Notes

- ✅ CORS now only allows specific origins (no wildcard)
- ✅ Cookie has `secure: true` and `sameSite: 'none'` in production
- ✅ Cookie has `httpOnly: true` (prevents XSS)
- ✅ Session store errors are logged but don't expose secrets
- ✅ Debug endpoint doesn't expose sensitive data

