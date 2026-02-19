# Logout Polling Fix Summary

## Problem Identified

The logout flow was completing successfully on the backend (session destroyed, cookie cleared, response sent), but the frontend UI remained stuck on "Logging out..." with repeated GET requests to `/api/profile/julia` (or similar user-specific endpoints).

## Root Causes

### 1. **User.js Infinite Loop** (Primary Issue)
- **Location**: `client/src/pages/User.js` line 46
- **Problem**: `getUserInfo()` was called directly in the component body, causing it to execute on every render
- **Effect**: Created infinite render loop:
  - Component renders → `getUserInfo()` runs → calls `getUserProfile(username)` (e.g., "julia")
  - State updates → component re-renders → `getUserInfo()` runs again
  - This caused repeated GET requests to `/api/profile/julia`

### 2. **Profile.js Infinite Polling**
- **Location**: `client/src/pages/Profile.js` `componentDidUpdate()`
- **Problem**: `componentDidUpdate()` runs on every state/prop update and kept fetching:
  - `/api/auth/user`
  - `/api/profile/items/${user}`
  - `getUserProfile(user)`
- **Effect**: Every state update triggered more API calls, which triggered more state updates

### 3. **No Centralized Auth State**
- **Problem**: Each component managed its own auth state independently
- **Effect**: When logout occurred, other components didn't know about it and continued polling user-specific endpoints

### 4. **Header Component Polling**
- **Location**: `client/src/components/Header.js`
- **Problem**: `setUp()` called `getUserProfile()` which could poll user endpoints
- **Effect**: Even after logout, Header continued trying to fetch user profile

## Solutions Implemented

### 1. Created AuthContext (`client/src/contexts/AuthContext.js`)
- **Single source of truth** for authentication state
- Provides `isAuthenticated`, `user`, `isLoading` to all components
- Centralized `logout()` function that:
  - Clears auth state immediately
  - Calls logout API endpoint
  - Forces fresh auth check
- Prevents multiple components from independently checking auth

### 2. Fixed User.js Infinite Loop
- **Changed**: Moved `getUserInfo()` from component body to `useEffect`
- **Added**: Proper dependency array `[username, authUser, isAuthenticated]`
- **Added**: `mounted` flag to prevent state updates after unmount
- **Result**: User info loads once when component mounts or username changes, not on every render

### 3. Fixed Profile.js Infinite Polling
- **Changed**: Replaced `componentDidUpdate()` infinite polling with controlled data loading
- **Added**: `dataLoaded` flag to prevent reloading after initial load
- **Changed**: Only reloads when auth user changes (login/logout), not on every state update
- **Added**: Uses AuthContext instead of fetching `/api/auth/user` repeatedly
- **Result**: Profile data loads once, only reloads on auth changes

### 4. Updated Header to Use AuthContext
- **Changed**: Removed local auth state management
- **Changed**: Uses `useAuth()` hook from AuthContext
- **Changed**: Logout handler calls `logoutFromContext()` which handles all cleanup
- **Added**: Stops all intervals/polling on logout
- **Result**: Header respects centralized auth state and stops polling on logout

### 5. Updated ProtectedRoute to Use AuthContext
- **Changed**: Removed local auth checking logic
- **Changed**: Uses `useAuth()` hook from AuthContext
- **Result**: ProtectedRoute uses same auth state as rest of app

### 6. Updated App.js
- **Added**: Wrapped app with `<AuthProvider>` to provide auth context
- **Result**: All components can access centralized auth state

## Files Changed

1. **`client/src/contexts/AuthContext.js`** (NEW)
   - Created AuthContext provider
   - Centralized auth state management
   - Centralized logout function

2. **`client/src/App.js`**
   - Wrapped app with AuthProvider
   - Updated ProtectedRoute to use AuthContext

3. **`client/src/components/Header.js`**
   - Removed local auth state
   - Uses AuthContext
   - Updated logout to stop all polling

4. **`client/src/pages/User.js`**
   - Fixed infinite loop by moving `getUserInfo()` to useEffect
   - Uses AuthContext for auth state
   - Proper cleanup on unmount

5. **`client/src/pages/Profile.js`**
   - Fixed infinite polling in componentDidUpdate
   - Uses AuthContext instead of fetching auth repeatedly
   - Only reloads on auth changes

## Expected Behavior After Fix

1. **On Logout:**
   - AuthContext immediately sets `isAuthenticated = false`, `user = null`
   - All components stop polling user-specific endpoints
   - Socket disconnects
   - All intervals cleared
   - UI navigates to `/login`
   - Button returns to normal state (no longer stuck on "Logging out...")

2. **After Logout:**
   - No more requests to `/api/profile/julia` or other user endpoints
   - ProtectedRoute redirects to `/login`
   - Refreshing `/profile` redirects to `/login`
   - `/api/auth` returns `{ authenticated: false }`

3. **During Normal Use:**
   - User.js loads user info once when component mounts
   - Profile.js loads data once, only reloads on auth changes
   - No infinite polling loops

## Testing Checklist

- [ ] Click logout → UI immediately shows "Logging out..." then navigates to login
- [ ] After logout, check Network tab → no more requests to `/api/profile/julia` or user endpoints
- [ ] After logout, try accessing `/profile` → redirects to `/login`
- [ ] After logout, call `/api/auth` → returns `{ authenticated: false }`
- [ ] Visit `/user/julia` → loads once, doesn't poll repeatedly
- [ ] Visit `/profile` → loads once, doesn't poll repeatedly
- [ ] Logout while on `/user/julia` → stops all requests immediately

