# PennThrift Deployment Plan

## Overview
This document provides exact steps to deploy PennThrift with frontend and backend on separate domains. The codebase uses:
- Express sessions with MongoDB store (`connect-mongo`)
- GridFS for file storage
- Socket.io for real-time messaging
- Passport.js authentication with session cookies

---

## 1. REQUIRED ENVIRONMENT VARIABLES

### Backend Server (.env file)
```env
# MongoDB Connection (REQUIRED)
DATABASE_ACCESS=mongodb+srv://username:password@cluster.mongodb.net/pennthrift?retryWrites=true&w=majority
# OR for local: mongodb://localhost:27017/pennthrift

# Session Secret (REQUIRED - generate strong random string)
SECRET_KEY=your-strong-random-secret-key-minimum-32-characters-long

# Server Configuration
PORT=4000
# OR let hosting platform set PORT (Heroku, Railway, Render, etc.)

# Frontend URL (REQUIRED for CORS and Socket.io)
FRONTEND_URL=https://your-frontend-domain.com
# OR http://localhost:3000 for local dev

# Backend URL (REQUIRED for file URLs and Socket.io)
WEBSITE=https://your-backend-domain.com
# OR http://localhost:4000 for local dev

# Environment
NODE_ENV=production
```

### Frontend Build Environment Variables
Set these before `npm run build`:
```bash
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

---

## 2. CODE CHANGES REQUIRED

### 2.1 Fix Session Cookie Configuration (server/server.js)

**Current code (lines 36-49):**
```javascript
app.use(session({
    key:'user_sid',
    secret:process.env.SECRET_KEY,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:600000 // equals six days
    },
    store: MongoStore.create({
        mongoUrl:process.env.DATABASE_ACCESS,
        collectionName:'userSessions'
    })
}));
```

**REPLACE WITH:**
```javascript
app.use(session({
    key:'user_sid',
    secret:process.env.SECRET_KEY,
    resave:false,
    saveUninitialized:false, // Changed: security best practice
    cookie:{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-domain support
        maxAge: 6 * 24 * 60 * 60 * 1000, // Fixed: 6 days in milliseconds (was 600000 = 10 minutes)
        domain: process.env.NODE_ENV === "production" ? undefined : undefined // Let browser set domain
    },
    store: MongoStore.create({
        mongoUrl:process.env.DATABASE_ACCESS,
        collectionName:'userSessions'
    })
}));
```

### 2.2 Fix CORS Configuration (server/server.js)

**Current code (lines 58-60):**
```javascript
app.use(cors({
    credentials: true,
}));
```

**REPLACE WITH:**
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 2.3 Fix Socket.io URL (server/server.js)

**Current code (line 24):**
```javascript
const socketUrl = process.env.NODE_ENV !== "production" ? 'http://localhost:3000' : "https://penn-thrift.herokuapp.com"
```

**REPLACE WITH:**
```javascript
const socketUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV !== "production" ? 'http://localhost:3000' : "https://penn-thrift.herokuapp.com");
```

**Update Socket.io CORS (lines 98-104):**
```javascript
const io = require('socket.io')(server,{
    cors: {
        origin: socketUrl,
        credentials: true,
        methods: ['GET', 'POST']
    }
});
```

### 2.4 Fix Frontend API Base URL (client/src/api/ProfileAPI.js)

**Current code (line 2):**
```javascript
export const path = process.env.NODE_ENV === "production" ? "https://penn-thrift-api.herokuapp.com" : "http://localhost:4000";
```

**REPLACE WITH:**
```javascript
export const path = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "production" ? "https://penn-thrift-api.herokuapp.com" : "http://localhost:4000");
```

### 2.5 Fix Socket.io Client Connection (client/src/components/Header.js)

**Current code (line 9):**
```javascript
const socket = io.connect('http://localhost:4000/api/messages')
```

**REPLACE WITH:**
```javascript
import { path } from '../api/ProfileAPI';
const socket = io.connect(`${path}/api/messages`, {
    withCredentials: true,
    transports: ['websocket', 'polling']
});
```

### 2.6 Fix File Upload URL Generation (server/routes/upload.js)

**Current code (line 27):**
```javascript
const imgUrl = `${website}:${port}/api/file/${req.file.filename}`;
```

**REPLACE WITH:**
```javascript
// Remove port if using standard HTTPS (443) or HTTP (80)
const protocol = website.includes('https') ? 'https' : 'http';
const baseUrl = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
const imgUrl = process.env.NODE_ENV === "production" 
    ? `${protocol}://${baseUrl}/api/file/${req.file.filename}`
    : `${website}:${port}/api/file/${req.file.filename}`;
```

### 2.7 Fix Axios Default Configuration (client/src/App.js)

**ADD after imports (around line 12):**
```javascript
import axios from 'axios';

// Configure axios for cross-domain cookies
axios.defaults.withCredentials = true;
```

**Also update the authentication check (line 30):**
```javascript
axios.post('/api/auth/', {}, { withCredentials: true }).then(res => {
    global.LOGGED_IN = res.data[0];
    setLoggedin(res.data[0])
});
```

### 2.8 Update All Relative API Calls to Use withCredentials

**Files to update:**
- `client/src/pages/Login.js` - Add `{ withCredentials: true }` to axios calls
- `client/src/pages/Register.js` - Add `{ withCredentials: true }` to axios calls
- `client/src/pages/Store.js` - Add `{ withCredentials: true }` to axios calls
- `client/src/pages/Profile.js` - Add `{ withCredentials: true }` to axios calls
- `client/src/pages/Messages.js` - Already uses `path` variable, but ensure axios has `withCredentials: true`
- `client/src/api/ProfileAPI.js` - Add `withCredentials: true` to all axios calls

**Example pattern for ProfileAPI.js:**
```javascript
export const getUserProfile = async (username) => {
    try {
        const res = await axios.get(url + username, { withCredentials: true });
        return res.data;
    } catch (err) {}
}
```

---

## 3. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Update all code changes listed in Section 2
- [ ] Set up MongoDB Atlas (or ensure MongoDB is accessible)
- [ ] Generate strong SECRET_KEY (use: `openssl rand -base64 32`)
- [ ] Choose hosting platforms:
  - [ ] Backend: Heroku / Railway / Render / DigitalOcean
  - [ ] Frontend: Vercel / Netlify / Cloudflare Pages / Same as backend

### Backend Deployment
- [ ] Create `.env` file on hosting platform with all required variables
- [ ] Ensure `DATABASE_ACCESS` points to production MongoDB
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to your frontend domain
- [ ] Set `WEBSITE` to your backend domain
- [ ] Deploy backend code
- [ ] Verify backend starts without errors
- [ ] Test backend health endpoint (create one if missing)

### Frontend Deployment
- [ ] Set environment variables:
  - `REACT_APP_API_URL=https://your-backend-domain.com`
  - `REACT_APP_SOCKET_URL=https://your-backend-domain.com`
- [ ] Build frontend: `cd client && npm run build`
- [ ] Deploy `build/` folder to hosting platform
- [ ] Configure hosting platform to serve `index.html` for all routes (SPA routing)

### Post-Deployment Verification
- [ ] Test authentication (login/register)
- [ ] Test session persistence (refresh page, stay logged in)
- [ ] Test file uploads (GridFS)
- [ ] Test Socket.io messaging
- [ ] Test CORS (frontend can call backend APIs)
- [ ] Check browser console for cookie warnings

---

## 4. SANITY TESTS

### 4.1 Database Connection Test

**Create test endpoint:** Add to `server/server.js` before routes:
```javascript
app.get('/api/health/db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        res.json({
            status: states[state],
            readyState: state,
            connected: state === 1
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Test command:**
```bash
curl https://your-backend-domain.com/api/health/db
```

**Expected response:**
```json
{"status":"connected","readyState":1,"connected":true}
```

### 4.2 Session Store Test

**Create test endpoint:** Add to `server/routes/auth.js`:
```javascript
router.get('/test-session', (req, res) => {
    req.session.testValue = 'session-works-' + Date.now();
    res.json({
        sessionId: req.sessionID,
        testValue: req.session.testValue,
        user: req.session.user || null
    });
});

router.get('/test-session-read', (req, res) => {
    res.json({
        sessionId: req.sessionID,
        testValue: req.session.testValue || 'not-found',
        user: req.session.user || null
    });
});
```

**Test commands:**
```bash
# Set session (save cookies)
curl -c cookies.txt -b cookies.txt https://your-backend-domain.com/api/auth/test-session

# Read session (use saved cookies)
curl -c cookies.txt -b cookies.txt https://your-backend-domain.com/api/auth/test-session-read
```

**Expected:** Second call should return the same `testValue`, proving MongoDB session store works.

### 4.3 GridFS Test

**Test upload:**
```bash
curl -X POST \
  -F "file=@/path/to/test-image.jpg" \
  -b cookies.txt \
  https://your-backend-domain.com/api/file/upload
```

**Expected response:**
```
https://your-backend-domain.com/api/file/1234567890-pennthrift-test-image.jpg
```

**Test download:**
```bash
curl https://your-backend-domain.com/api/file/1234567890-pennthrift-test-image.jpg -o downloaded.jpg
```

**Verify:** `downloaded.jpg` should be identical to original file.

**Check MongoDB:**
```javascript
// In MongoDB shell or Compass
use pennthrift
db.photos.files.find().pretty()
db.photos.chunks.find().limit(1).pretty()
```

### 4.4 Socket.io Connection Test

**Add to client:** Create `client/src/test-socket.js`:
```javascript
import io from 'socket.io-client';
import { path } from './api/ProfileAPI';

const socket = io.connect(`${path}/api/messages`, {
    withCredentials: true,
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('✅ Socket.io connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket.io error:', error);
});

export default socket;
```

**Import in App.js:** `import './test-socket';`

**Check browser console:** Should see "✅ Socket.io connected" message.

### 4.5 CORS Test

**Test from browser console (on frontend domain):**
```javascript
fetch('https://your-backend-domain.com/api/auth/user', {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected:** Should return user data or `null` without CORS errors.

### 4.6 Cookie Test

**Check browser DevTools:**
1. Open Application/Storage tab
2. Go to Cookies → your-frontend-domain.com
3. Look for `user_sid` cookie
4. Verify:
   - `HttpOnly` is checked
   - `Secure` is checked (if HTTPS)
   - `SameSite` is `None` (if cross-domain)
   - `Domain` matches backend domain (or is not set)

---

## 5. COMMON ISSUES & FIXES

### Issue: Cookies not being sent cross-domain
**Fix:** Ensure:
- `withCredentials: true` in all axios calls
- `credentials: true` in CORS config
- `sameSite: "none"` and `secure: true` in session cookie config
- Frontend and backend both use HTTPS (required for `sameSite: none`)

### Issue: Session not persisting
**Fix:** 
- Check MongoDB connection string includes database name
- Verify `userSessions` collection exists in MongoDB
- Check session cookie expiration (currently 6 days)
- Ensure `saveUninitialized: false` (prevents empty sessions)

### Issue: GridFS files not accessible
**Fix:**
- Verify `photos` bucket exists in MongoDB
- Check file URL format matches: `${WEBSITE}/api/file/${filename}`
- Ensure GridFS connection established (check `connection.once('open')`)

### Issue: Socket.io connection fails
**Fix:**
- Verify `FRONTEND_URL` matches exact frontend domain (no trailing slash)
- Check Socket.io CORS includes `credentials: true`
- Ensure both frontend and backend URLs are accessible
- Check firewall/security groups allow WebSocket connections

### Issue: CORS errors in browser
**Fix:**
- Verify `origin` in CORS config matches frontend domain exactly
- Ensure `credentials: true` in CORS config
- Check preflight OPTIONS requests are handled (Express CORS should handle this)

---

## 6. PRODUCTION SECURITY CHECKLIST

- [ ] `SECRET_KEY` is strong random string (32+ characters)
- [ ] `NODE_ENV=production` set
- [ ] `saveUninitialized: false` in session config
- [ ] `secure: true` in cookie config (HTTPS only)
- [ ] MongoDB connection string uses authentication
- [ ] MongoDB IP whitelist configured (if using Atlas)
- [ ] Rate limiting enabled (express-brute already in auth routes)
- [ ] HTTPS enabled on both frontend and backend
- [ ] Environment variables not exposed in client code
- [ ] Error messages don't leak sensitive information

---

## 7. QUICK REFERENCE: ENVIRONMENT VARIABLES SUMMARY

### Backend (.env)
```
DATABASE_ACCESS=mongodb+srv://user:pass@cluster.mongodb.net/pennthrift
SECRET_KEY=<32+ char random string>
FRONTEND_URL=https://your-frontend.com
WEBSITE=https://your-backend.com
PORT=4000 (or let platform set)
NODE_ENV=production
```

### Frontend (build-time)
```
REACT_APP_API_URL=https://your-backend.com
REACT_APP_SOCKET_URL=https://your-backend.com
```

---

## 8. DEPLOYMENT COMMANDS

### Backend
```bash
cd server
npm install --production
# Set environment variables on hosting platform
# Deploy code
```

### Frontend
```bash
cd client
export REACT_APP_API_URL=https://your-backend.com
export REACT_APP_SOCKET_URL=https://your-backend.com
npm install
npm run build
# Deploy build/ folder
```

---

**END OF DEPLOYMENT PLAN**

