# Session Authentication Issue - Debug Context

## Problem Description

After successful login/registration, users are briefly redirected to `/profile` but then immediately redirected back to `/login`. The path changes to `/profile` for a moment, but the page never fully renders before redirecting back.

## Current Setup

### Architecture
- **Frontend**: React app deployed on Netlify (`https://pennthrift.netlify.app`)
- **Backend**: Express.js API deployed on Render (`https://pennthrift.onrender.com`)
- **Database**: MongoDB Atlas
- **Session Store**: MongoDB via `connect-mongo` (MongoStore)
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express-session with MongoDB store

### Environment Variables

**Backend (Render):**
- `DATABASE_ACCESS`: MongoDB Atlas connection string
- `SECRET_KEY`: Session secret key
- `FRONTEND_URL`: `https://pennthrift.netlify.app`
- `NODE_ENV`: `production`

**Frontend (Netlify):**
- `REACT_APP_API_URL`: `https://pennthrift.onrender.com`

## What We've Tried

### 1. Added Explicit Session Save
**File**: `server/routes/auth.js`

```javascript
// Login handler
router.post('/login', userBruteforce.prevent, passport.authenticate('local', { failWithError: true }),
    function(req, res, next) {
        req.session.user = req.user.username;
        req.brute.reset();
        
        // Explicitly save the session before responding
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).send({ error: 'Failed to save session' });
            }
            
            if (!req.user.locked_out) {
                const currentTimestamp = moment().unix();
                const currentDatetime = moment(currentTimestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
                res.status(200).send({ data: 'success', user: req.user, time: currentDatetime });
            } else {
                res.status(202).send({ data: 'lockedout', user: req.user });
            }
        });
    },
    // error handler...
);
```

**Result**: Session is now explicitly saved, but issue persists.

### 2. Added Retry Logic in ProtectedRoute
**File**: `client/src/App.js`

```javascript
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let retries = 0;
    const maxRetries = 3;
    const retryDelay = 300;
    
    const checkAuth = async () => {
      try {
        const res = await api.post('/api/auth/');
        const authenticated = res.data[0] === true;
        
        if (mounted) {
          if (!authenticated && retries < maxRetries && global.LOGGED_IN === true) {
            retries++;
            console.log(`Auth check failed, retrying (${retries}/${maxRetries})...`);
            setTimeout(checkAuth, retryDelay);
            return;
          }
          
          global.LOGGED_IN = authenticated;
          setIsAuthenticated(authenticated);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // retry logic...
      }
    };

    if (global.LOGGED_IN === true) {
      setTimeout(checkAuth, 100);
    } else {
      checkAuth();
    }
  }, [location.pathname]);

  if (isLoading || isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
```

**Result**: Retries happen but eventually fail and redirect.

### 3. Added Navigation Delays
**File**: `client/src/pages/Login.js`

```javascript
if (res.status === 200) {
    global.LOGGED_IN = true;
    // ... update last_login ...
    setTimeout(() => {
        navigate(from, { replace: true });
    }, 300);
}
```

**Result**: Delay helps but doesn't solve the root issue.

## Current Session Configuration

**File**: `server/server.js`

```javascript
app.use(session({
  name: 'user_sid',
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_ACCESS,
    collectionName: 'userSessions'
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' in production
    maxAge: 6 * 24 * 60 * 60 * 1000
  }
}));
```

## CORS Configuration

**File**: `server/server.js`

```javascript
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://pennthrift.netlify.app',
      'http://localhost:3000'
    ].filter(Boolean);
    
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Currently allowing all
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## API Client Configuration

**File**: `client/src/api/http.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

export default api;
```

## Auth Check Endpoint

**File**: `server/routes/auth.js`

```javascript
router.post('/', async(req, res) =>{
    if (req.session.user && req.cookies.user_sid) {
        res.json([true, req.session.user])
    } else {
        res.json([false, null])
    }
});
```

## What to Check/Debug

### 1. Cookie Issues
- **Check browser DevTools → Application → Cookies**
  - Is `user_sid` cookie being set after login?
  - What domain is it set for? (Should be `.onrender.com` or the backend domain)
  - Is `Secure` flag set? (Should be true in production)
  - Is `SameSite` set to `None`? (Required for cross-domain)
  - Is `HttpOnly` set? (Should be true)

### 2. Network Tab Analysis
- **After login, check Network tab:**
  - Does `/api/auth/login` response include `Set-Cookie` header?
  - What does the `Set-Cookie` header look like?
  - When `/api/auth/` is called, does the request include `Cookie` header?
  - What cookies are being sent with the auth check request?

### 3. Session Store Issues
- **Check MongoDB:**
  - Are sessions being saved to the `userSessions` collection?
  - What does a session document look like?
  - Is the session ID matching the cookie value?

### 4. Cross-Domain Cookie Issues
- **Potential problems:**
  - `sameSite: 'none'` requires `secure: true` (should be set)
  - Cookies might not be sent cross-domain if domain/path mismatch
  - Browser might block third-party cookies

### 5. Timing Issues
- **Check console logs:**
  - Are retry attempts happening?
  - What does the auth check response show?
  - Is `global.LOGGED_IN` true when redirect happens?

## Key Questions to Answer

1. **Is the session cookie being set?** (Check browser cookies)
2. **Is the cookie being sent with subsequent requests?** (Check Network tab)
3. **Is the session being saved to MongoDB?** (Check database)
4. **Is the session ID matching between cookie and database?** (Compare values)
5. **Are there any CORS preflight issues?** (Check Network tab for OPTIONS requests)
6. **Is `req.session.user` actually set when checking?** (Add logging)

## Suggested Debugging Steps

1. **Add detailed logging to auth check:**
```javascript
router.post('/', async(req, res) =>{
    console.log('Auth check - Session:', req.session);
    console.log('Auth check - Cookies:', req.cookies);
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - Session user:', req.session.user);
    
    if (req.session.user && req.cookies.user_sid) {
        res.json([true, req.session.user])
    } else {
        res.json([false, null])
    }
});
```

2. **Add logging to login handler:**
```javascript
req.session.save((err) => {
    if (err) {
        console.error('Session save error:', err);
        return res.status(500).send({ error: 'Failed to save session' });
    }
    console.log('Session saved - ID:', req.sessionID);
    console.log('Session saved - User:', req.session.user);
    // ... rest of code
});
```

3. **Check cookie domain/path settings:**
   - May need to explicitly set `domain` in cookie config
   - May need to set `path: '/'` explicitly

4. **Verify MongoDB connection:**
   - Ensure `DATABASE_ACCESS` is correct
   - Check if MongoStore is actually connecting
   - Verify session collection exists

## Potential Solutions to Try

1. **Explicit cookie domain/path:**
```javascript
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 6 * 24 * 60 * 60 * 1000,
  domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined,
  path: '/'
}
```

2. **Verify session is loaded:**
   - May need to explicitly reload session after save
   - Check if `req.session.reload()` is needed

3. **Check if cookie is being blocked:**
   - Browser might be blocking third-party cookies
   - Try in incognito/private mode
   - Check browser cookie settings

4. **Alternative: Use token-based auth instead of sessions**
   - JWT tokens in Authorization header
   - Avoids cookie issues entirely

## Current Behavior

1. User clicks login → API call succeeds (status 200)
2. `global.LOGGED_IN = true` is set on client
3. Client waits 300ms, then navigates to `/profile`
4. ProtectedRoute mounts and checks `/api/auth/`
5. Auth check returns `[false, null]` (session not found)
6. Retries happen (up to 3 times with 300ms delays)
7. All retries fail → redirects to `/login`

## Expected Behavior

1. User clicks login → API call succeeds
2. Session is saved to MongoDB
3. Cookie is set in browser
4. Client navigates to `/profile`
5. ProtectedRoute checks `/api/auth/`
6. Cookie is sent with request
7. Server finds session in MongoDB
8. Auth check returns `[true, username]`
9. User stays on `/profile`

## Files Modified

- `server/routes/auth.js` - Added `req.session.save()`
- `client/src/App.js` - Added retry logic in ProtectedRoute
- `client/src/pages/Login.js` - Added navigation delay
- `client/src/pages/Register.js` - Added navigation delay and session save

## Next Steps

1. Add the debugging logs mentioned above
2. Check browser cookies and network requests
3. Verify MongoDB session storage
4. Test cookie domain/path settings
5. Consider alternative authentication approach if cookies can't be fixed



