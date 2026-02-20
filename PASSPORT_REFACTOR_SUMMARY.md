# Passport Sessions Refactor - Summary

## Overview
Refactored authentication to use Passport sessions correctly instead of manually storing `req.session.user`. This ensures proper session management and eliminates the need for `global.LOGGED_IN` on the frontend.

## Changes Made

### Backend (`server/routes/auth.js`)

#### 1. Login Handler
**Before:**
```javascript
req.session.user = req.user.username;
req.session.save((err) => { ... });
```

**After:**
```javascript
req.logIn(req.user, (err) => {
  // Passport handles session serialization
  // Session stored as req.session.passport.user = user._id
});
```

**Key Changes:**
- ✅ Uses `req.logIn()` instead of manual `req.session.user`
- ✅ Passport automatically serializes user (stores `user._id` via `serializeUser`)
- ✅ Session is properly managed by Passport middleware

#### 2. Register Handler
**Before:**
```javascript
request.session.user = username;
request.session.save((err) => { ... });
```

**After:**
```javascript
request.logIn(data, (err) => {
  // Passport establishes session after registration
});
```

**Key Changes:**
- ✅ Uses `req.logIn()` after user creation
- ✅ User is automatically logged in after registration

#### 3. Auth Check Endpoint
**Before:**
```javascript
router.post('/', async(req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.json([true, req.session.user])
  } else {
    res.json([false, null])
  }
});
```

**After:**
```javascript
router.get('/', async(req, res) => {
  const authenticated = req.isAuthenticated();
  if (authenticated && req.user) {
    res.json({ authenticated: true, user: { username: req.user.username, id: req.user._id } });
  } else {
    res.json({ authenticated: false, user: null });
  }
});
```

**Key Changes:**
- ✅ Changed from POST to GET (more RESTful)
- ✅ Uses `req.isAuthenticated()` as single source of truth
- ✅ Returns structured response: `{authenticated: boolean, user: object|null}`
- ✅ Removed dependency on `req.cookies.user_sid`
- ✅ Kept POST endpoint for backward compatibility during transition

#### 4. Logout Handler
**Before:**
```javascript
req.session.destroy();
```

**After:**
```javascript
req.logout((err) => {
  req.session.destroy((err) => { ... });
});
```

**Key Changes:**
- ✅ Uses `req.logout()` for proper Passport cleanup
- ✅ Then destroys session

#### 5. User Endpoint
**Before:**
```javascript
const user = req.session.user;
```

**After:**
```javascript
if (req.isAuthenticated() && req.user) {
  res.json(req.user.username);
}
```

**Key Changes:**
- ✅ Uses `req.user` from Passport instead of `req.session.user`

### Frontend (`client/src/App.js`)

#### ProtectedRoute Component
**Before:**
- Used `global.LOGGED_IN` as source of truth
- POST to `/api/auth/`
- Complex retry logic based on `global.LOGGED_IN`
- Returned `null` while loading (blank screen)

**After:**
```javascript
const checkAuth = async () => {
  const res = await api.get('/api/auth/');
  const { authenticated, user } = res.data;
  setIsAuthenticated(authenticated);
  setUser(user);
  setIsLoading(false);
};
```

**Key Changes:**
- ✅ Removed all `global.LOGGED_IN` usage
- ✅ Uses GET `/api/auth/` endpoint
- ✅ Uses `authenticated` from API response as single source of truth
- ✅ Shows loading state instead of blank screen
- ✅ Simplified logic - no retries needed (Passport handles session properly)
- ✅ Stores user data from response

### Frontend (`client/src/pages/Login.js` & `Register.js`)

**Before:**
```javascript
global.LOGGED_IN = true;
setTimeout(() => navigate(...), 300);
```

**After:**
```javascript
// No global.LOGGED_IN setting
// ProtectedRoute will check auth via GET /api/auth
setTimeout(() => navigate(...), 200);
```

**Key Changes:**
- ✅ Removed `global.LOGGED_IN = true`
- ✅ Reduced delay (Passport sessions are more reliable)
- ✅ ProtectedRoute handles auth check automatically

### Frontend (`client/src/components/Header.js`)

**Before:**
```javascript
const res = await api.get('/api/auth/user');
setUser(res.data);
{global.LOGGED_IN ? <Logout /> : <Login />}
```

**After:**
```javascript
const authRes = await api.get('/api/auth/');
const { authenticated, user: authUser } = authRes.data;
setIsAuthenticated(authenticated);
setUser(authUser?.username);
{isAuthenticated ? <Logout /> : <Login />}
```

**Key Changes:**
- ✅ Uses GET `/api/auth/` instead of `/api/auth/user`
- ✅ Uses `isAuthenticated` state instead of `global.LOGGED_IN`
- ✅ Gets user from auth check response

## New Authentication Flow

### 1. Login Flow
```
User submits credentials
  ↓
POST /api/auth/login
  ↓
passport.authenticate('local') validates credentials
  ↓
req.logIn(req.user) establishes Passport session
  ↓
Session stored as: req.session.passport.user = user._id
  ↓
Cookie 'user_sid' set with session ID
  ↓
Response sent with success
  ↓
Frontend navigates to /profile
  ↓
ProtectedRoute calls GET /api/auth/
  ↓
Passport middleware loads session from cookie
  ↓
deserializeUser loads full user object → req.user
  ↓
req.isAuthenticated() returns true
  ↓
Response: {authenticated: true, user: {username, id}}
  ↓
User stays on /profile
```

### 2. Auth Check Flow
```
ProtectedRoute mounts
  ↓
GET /api/auth/
  ↓
Express-session loads session from cookie
  ↓
Passport middleware checks req.session.passport.user
  ↓
If present: deserializeUser loads user → req.user
  ↓
req.isAuthenticated() checks if req.user exists
  ↓
Response: {authenticated: boolean, user: object|null}
  ↓
ProtectedRoute renders or redirects based on response
```

### 3. Session Storage
- **Session ID**: Stored in cookie `user_sid`
- **Session Data**: Stored in MongoDB `userSessions` collection
- **User Identifier**: `req.session.passport.user = user._id` (serialized)
- **Full User**: Loaded via `deserializeUser` → `req.user`

## Key Benefits

1. **Single Source of Truth**: `req.isAuthenticated()` is the only auth check needed
2. **Proper Session Management**: Passport handles serialization/deserialization
3. **No Global State**: Frontend uses API response, not `global.LOGGED_IN`
4. **RESTful API**: GET for auth check (idempotent)
5. **Better Security**: Only user ID stored in session, full user loaded on demand
6. **Simpler Code**: No manual session management, no retry logic needed

## Passport Configuration (Already Correct)

**File**: `server/passport-config.js`

```javascript
passport.serializeUser((user, done) => {
  done(null, user._id); // Store only ID
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user); // Load full user object
  });
});
```

✅ Already correctly configured - stores minimal identifier (`user._id`)

## Session Cookie Configuration

**File**: `server/server.js`

```javascript
cookie: {
  name: 'user_sid', // ✅ Kept as requested
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 6 * 24 * 60 * 60 * 1000,
  path: '/'
}
```

✅ Cookie name remains `user_sid` as requested

## Testing Checklist

1. **Login**:
   - [ ] User can log in successfully
   - [ ] Session cookie is set
   - [ ] User is redirected to /profile
   - [ ] User stays on /profile (no redirect back to login)

2. **Register**:
   - [ ] User can register successfully
   - [ ] User is automatically logged in
   - [ ] User is redirected to /profile
   - [ ] User stays on /profile

3. **Auth Check**:
   - [ ] GET /api/auth/ returns `{authenticated: true, user: {...}}` when logged in
   - [ ] GET /api/auth/ returns `{authenticated: false, user: null}` when logged out
   - [ ] ProtectedRoute shows loading state
   - [ ] ProtectedRoute redirects to login when not authenticated

4. **Header**:
   - [ ] Shows "Logout" when authenticated
   - [ ] Shows "Login" when not authenticated
   - [ ] Logout works correctly

5. **Session Persistence**:
   - [ ] Refresh page → user stays logged in
   - [ ] Navigate between routes → auth persists
   - [ ] Close browser → session persists (until maxAge)

## Files Changed

- `server/routes/auth.js` - Refactored to use Passport sessions
- `client/src/App.js` - Updated ProtectedRoute to use GET /api/auth
- `client/src/pages/Login.js` - Removed global.LOGGED_IN
- `client/src/pages/Register.js` - Removed global.LOGGED_IN
- `client/src/components/Header.js` - Uses GET /api/auth instead of global.LOGGED_IN

## Backward Compatibility

- ✅ POST `/api/auth/` endpoint still exists (returns old format `[true, username]`)
- ✅ Can be removed after confirming frontend works with GET endpoint



