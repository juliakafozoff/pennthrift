# How to Debug Logout Issues

This guide helps identify where the logout flow is failing.

## Logout Flow Call Chain

```
Frontend: Header.js
  └─> logOut() function (line ~20)
      └─> api.post('/api/auth/logout', {}, { withCredentials: true })
          └─> Axios interceptor (http.js) logs request
              └─> Backend: server/routes/auth.js
                  └─> router.post('/logout', ...) (line ~157)
                      └─> req.logout()
                          └─> req.session.destroy()
                              └─> res.clearCookie('user_sid')
                                  └─> res.json({ success: true })
                                      └─> Axios interceptor logs response
                                          └─> Frontend: clear state + navigate('/login')
```

## Expected Console Output

### Frontend Console (Browser DevTools)

When logout is clicked, you should see:

1. **Logout click handler:**
   ```
   🔴 [LOGOUT] ============================================
   🔴 [LOGOUT] Logout click handler triggered
   🔴 [LOGOUT] Setting loggingOut state to true
   🔴 [LOGOUT] loggingOut state: true
   ```

2. **Socket disconnection:**
   ```
   🔴 [LOGOUT] Disconnecting socket...
   🟢 [LOGOUT] Socket disconnected successfully
   ```

3. **Axios request interceptor:**
   ```
   🌐 [AXIOS REQUEST] ============================================
   🌐 [AXIOS REQUEST] Method: POST
   🌐 [AXIOS REQUEST] URL: /api/auth/logout
   🌐 [AXIOS REQUEST] Full URL: http://localhost:4000/api/auth/logout
   🌐 [AXIOS REQUEST] withCredentials: true
   ```

4. **Axios response interceptor (on success):**
   ```
   🌐 [AXIOS RESPONSE] ============================================
   🌐 [AXIOS RESPONSE] Status: 200
   🌐 [AXIOS RESPONSE] Data: { success: true }
   🌐 [AXIOS RESPONSE] Set-Cookie header: [cookie clearing header]
   ```

5. **State updates and navigation:**
   ```
   🟢 [LOGOUT] Promise resolved successfully
   🟢 [LOGOUT] Response status: 200
   🔴 [LOGOUT] Clearing local auth state...
   🟢 [LOGOUT] Local auth state cleared
   🔴 [LOGOUT] About to navigate to /login
   🟢 [LOGOUT] Navigate() called - navigation should occur
   🔴 [LOGOUT] Finally block executing
   🔴 [LOGOUT] Setting loggingOut state to false
   ```

### Backend Console (Server Logs)

When logout request arrives, you should see:

1. **Request received:**
   ```
   🔴 [LOGOUT_START] ============================================
   🔴 [LOGOUT_START] Method: POST
   🔴 [LOGOUT_START] URL: /logout
   🔴 [LOGOUT_START] Session ID: [session-id]
   🔴 [LOGOUT_START] req.isAuthenticated(): true
   ```

2. **Passport logout:**
   ```
   🔴 [LOGOUT_BEFORE_LOGOUT_CALL] About to call req.logout()
   🟢 [LOGOUT_AFTER_LOGOUT_CALL] req.logout() callback executed successfully
   ```

3. **Session destruction:**
   ```
   🔴 [LOGOUT_BEFORE_SESSION_DESTROY] About to call req.session.destroy()
   🟢 [LOGOUT_AFTER_SESSION_DESTROY] Session destroy callback executed successfully
   ```

4. **Cookie clearing:**
   ```
   🔴 [LOGOUT_BEFORE_CLEAR_COOKIE] About to clear cookie: user_sid
   🟢 [LOGOUT_BEFORE_CLEAR_COOKIE] Cookie cleared
   ```

5. **Response sent:**
   ```
   🔴 [LOGOUT_RESPONSE_SENT] About to send response
   🟢 [LOGOUT_RESPONSE_SENT] Response sent successfully
   ```

## DevTools Network Tab

### Expected Behavior

1. **Request appears:**
   - Method: `POST`
   - URL: `/api/auth/logout` (or full URL)
   - Status: `200` (or pending if stuck)

2. **Request Headers should include:**
   ```
   Cookie: user_sid=[session-id]
   ```

3. **Response Headers should include:**
   ```
   Set-Cookie: user_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None
   ```

### Failure Scenarios

#### A) Request shows "pending" forever
- **Symptom:** Network tab shows request as "pending" (spinning)
- **Likely cause:** Backend not responding (hanging in `req.session.destroy()` callback)
- **Check:** Backend logs should show `LOGOUT_BEFORE_SESSION_DESTROY` but not `LOGOUT_AFTER_SESSION_DESTROY`
- **Fix:** Ensure `req.session.destroy()` callback always calls `res.json()` even on error

#### B) Request shows "blocked" or CORS error
- **Symptom:** Network tab shows "CORS policy" error or request blocked
- **Likely cause:** CORS configuration issue
- **Check:** Backend logs should NOT show `LOGOUT_START` (request never reached backend)
- **Fix:** Verify CORS allows credentials and logout route origin

#### C) Request succeeds (200) but UI stuck on "Logging out..."
- **Symptom:** Network shows 200, but button still shows "Logging out..."
- **Likely cause:** Frontend state not updating (promise not resolving or `finally` block not executing)
- **Check:** Frontend console should show response but not "Finally block executing"
- **Fix:** Ensure `setLoggingOut(false)` is in `finally` block

#### D) Request succeeds, UI redirects, but user still authenticated after refresh
- **Symptom:** Logout appears successful, but `/api/auth` still returns `authenticated: true`
- **Likely cause:** Session not destroyed or cookie not cleared properly
- **Check:** Use `/api/debug/whoami` endpoint to verify session state
- **Fix:** Verify cookie clearing attributes match session cookie attributes

## Diagnostic Endpoints

### GET /api/debug/whoami
Returns current authentication status:
```json
{
  "authenticated": false,
  "user": null,
  "sessionID": null
}
```

Use this after logout to verify session was cleared.

### GET /api/debug/session
Returns detailed session information for debugging.

## Troubleshooting Steps

1. **Open Browser DevTools Console** (F12)
2. **Open Browser DevTools Network Tab**
3. **Click Logout button**
4. **Check Frontend Console:**
   - Does it show `[LOGOUT] Logout click handler triggered`?
   - Does it show `[AXIOS REQUEST]`?
   - Does it show `[AXIOS RESPONSE]` or `[AXIOS RESPONSE ERROR]`?
5. **Check Network Tab:**
   - Is the request pending, blocked, or completed?
   - What status code? (200, 500, CORS error?)
   - Check request headers for Cookie
   - Check response headers for Set-Cookie
6. **Check Backend Console:**
   - Does it show `[LOGOUT_START]`? (If not, request not reaching backend)
   - Where does it stop? (Which LOGOUT_* tag is last?)
7. **After logout, test:**
   - Call `GET /api/debug/whoami` - should return `authenticated: false`
   - Try accessing `/profile` - should redirect to `/login`

## Common Issues and Fixes

### Issue: Request pending forever
**Root cause:** `req.session.destroy()` callback may not be executing
**Fix:** Ensure MongoDB session store is connected and callback is called

### Issue: CORS error
**Root cause:** CORS not configured for logout route or credentials not allowed
**Fix:** Verify `server.js` CORS config includes `credentials: true` and allows frontend origin

### Issue: UI stuck but request succeeds
**Root cause:** React state update issue or navigation blocked
**Fix:** Ensure `setLoggingOut(false)` is in `finally` block, check for navigation guards

### Issue: Session persists after logout
**Root cause:** Cookie not cleared with matching attributes
**Fix:** Ensure `res.clearCookie()` uses same `httpOnly`, `secure`, `sameSite`, `path` as session config

