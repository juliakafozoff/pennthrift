
const express       = require('express');
const router        = express.Router();
const User          = require('../models/user.model');
const Message       = require('../models/message.model');
const bcrypt        = require('bcrypt');
const passport      = require('passport');
const session       = require('express-session');
const moment = require('moment');
const ExpressBrute = require('express-brute');
const store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
let message = '';

const lockoutCallback = function(req, res, next, nextValidRequestDate) {
    res.status(429).send({ status: 'lockedout', error: 'Too many attempts, please try again later' });
    // logger.auth.info(`Lockout: ${req.ip} Next Valid: ${nextValidRequestDate}`);
};
 

// Start slowing requests after 5 failed attempts to do something for the same user
const userBruteforce = new ExpressBrute(store, {
    freeRetries: 5, // Allow 5 free attempts before rate limiting kicks in
    minWait: 1*60*1000, // 1 minute minimum wait
    maxWait: 60*60*1000, // 1 hour maximum wait
    failCallback: lockoutCallback,
});

// Auth check endpoint with detailed logging
router.get('/', (req, res) => {
    console.log('🔵 [AUTH CHECK] ============================================');
    console.log('🔵 [AUTH CHECK] Request received');
    console.log('🔵 [AUTH CHECK] Origin:', req.headers.origin);
    console.log('🔵 [AUTH CHECK] Cookie header:', req.headers.cookie || 'NO COOKIE HEADER');
    console.log('🔵 [AUTH CHECK] Session ID:', req.sessionID || 'NO SESSION ID');
    console.log('🔵 [AUTH CHECK] Session exists:', !!req.session);
    console.log('🔵 [AUTH CHECK] Session keys:', req.session ? Object.keys(req.session) : 'NO SESSION');
    console.log('🔵 [AUTH CHECK] Passport session:', req.session?.passport || 'NO PASSPORT SESSION');
    console.log('🔵 [AUTH CHECK] req.user:', req.user ? { username: req.user.username, id: req.user._id } : 'NO USER');
    console.log('🔵 [AUTH CHECK] req.isAuthenticated exists:', typeof req.isAuthenticated === 'function');
    
    const authenticated = req.isAuthenticated && req.isAuthenticated();
    console.log('🔵 [AUTH CHECK] req.isAuthenticated() result:', authenticated);
    
    if (authenticated && req.user) {
        console.log('✅ [AUTH CHECK] AUTHENTICATED - User:', req.user.username);
        console.log('🔵 [AUTH CHECK] ============================================');
        res.json({
            authenticated: true,
            user: {
                username: req.user.username,
                id: req.user._id || req.user.id
            }
        });
    } else {
        console.log('❌ [AUTH CHECK] NOT AUTHENTICATED');
        console.log('❌ [AUTH CHECK] Reason:', {
            hasIsAuthenticated: typeof req.isAuthenticated === 'function',
            authenticatedResult: authenticated,
            hasUser: !!req.user,
            hasSession: !!req.session,
            hasPassportSession: !!req.session?.passport,
            cookieHeader: req.headers.cookie ? 'PRESENT' : 'MISSING'
        });
        console.log('🔵 [AUTH CHECK] ============================================');
        res.json({
            authenticated: false,
            user: null
        });
    }
});

// Keep POST endpoint for backward compatibility during transition
router.post('/', async(req, res) =>{
    const authenticated = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
    
    if (authenticated && req.user) {
        res.json([true, req.user.username]);
    } else {
        res.json([false, null]);
    }
});

// Simple register handler
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    // Normalize username to lowercase for storage and uniqueness check
    const normalizedUsername = username ? username.trim().toLowerCase() : null;
    
    if (!normalizedUsername) {
        return res.status(400).json('Error: Username is required');
    }
    
    // Check if user already exists (case-insensitive)
    const userExists = await User.findOne({ 
        $or: [
            { username: normalizedUsername },
            { usernameLower: normalizedUsername }
        ]
    });
    if (userExists) {
        return res.status(409).json('Error: User is already registered');
    }
    
    try {
        // Create new user (username will be stored as lowercase via schema)
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username: normalizedUsername, // Store lowercase
            password: hashedPassword
        });
        
        const savedUser = await newUser.save();
        
        // Log in the new user
        req.logIn(savedUser, (err) => {
            if (err) {
                return res.status(500).json('Error: Failed to establish session');
            }
            
            // Save session, then respond
            req.session.save((saveErr) => {
                if (saveErr) {
                    return res.status(500).json('Error: Failed to save session');
                }
                res.json('successful');
            });
        });
    } catch (error) {
        res.status(500).json('Error: Registration failed');
    }
});

router.get('/user', (req, res) => {
    try{
        // Use Passport's req.user instead of req.session.user
        if (req.isAuthenticated() && req.user) {
            res.json(req.user.username);
        } else {
            res.json(null);
        }
    }catch(err){
        console.error('Error getting user:', err);
        res.json(null);
    }
})

// Demo login endpoint - creates or logs in demo user
router.post('/demo', async (req, res) => {
    try {
        const DEMO_USERNAME = 'demo';
        const DEMO_PASSWORD = 'demo123'; // Simple password for demo
        
        // Check if demo user exists
        let demoUser = await User.findOne({ 
            $or: [
                { username: DEMO_USERNAME },
                { usernameLower: DEMO_USERNAME }
            ]
        });
        
        // Create demo user if doesn't exist
        if (!demoUser) {
            const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
            demoUser = new User({
                username: DEMO_USERNAME,
                usernameLower: DEMO_USERNAME,
                password: hashedPassword,
                bio: 'Demo user - try out PennThrift!',
                class_year: '2025',
                isDemo: true // Flag to identify demo user
            });
            await demoUser.save();
        } else {
            // Ensure existing demo user has isDemo flag
            if (!demoUser.isDemo) {
                demoUser.isDemo = true;
                await demoUser.save();
            }
        }
        
        // Log in the demo user
        req.logIn(demoUser, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to establish session' });
            }
            
            req.session.save((saveErr) => {
                if (saveErr) {
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                
                // Return user data (without password)
                const userResponse = {
                    username: demoUser.username,
                    id: demoUser._id || demoUser.id,
                    isDemo: true
                };
                
                res.json({
                    success: true,
                    user: userResponse
                });
            });
        });
    } catch (error) {
        console.error('Demo login error:', error);
        res.status(500).json({ error: 'Demo login failed' });
    }
});

// Demo logout endpoint - wipes all demo user's chat data
router.post('/demo/logout', async (req, res) => {
    try {
        // Verify user is authenticated and is demo user
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = req.user;
        const DEMO_USERNAME = 'demo';
        
        // Verify this is the demo user
        const isDemoUser = user.username === DEMO_USERNAME || 
                          user.usernameLower === DEMO_USERNAME || 
                          user.isDemo === true;
        
        if (!isDemoUser) {
            return res.status(403).json({ error: 'Not a demo user' });
        }
        
        // Find all Message documents where demo user is in the users array
        const demoMessages = await Message.find({ 
            users: { $in: [DEMO_USERNAME, user._id.toString()] } 
        });
        
        // Get all message IDs to delete
        const messageIds = demoMessages.map(msg => msg._id);
        
        // Delete all Message documents
        await Message.deleteMany({ 
            _id: { $in: messageIds } 
        });
        
        // Clear demo user's chats and unread arrays
        await User.findOneAndUpdate(
            { _id: user._id },
            { 
                $set: { 
                    chats: [], 
                    unread: [] 
                } 
            }
        );
        
        // Logout the session
        req.logout((err) => {
            if (err) {
                console.error('Error during demo logout:', err);
                return res.status(500).json({ error: 'Failed to logout session' });
            }
            
            req.session.destroy((destroyErr) => {
                if (destroyErr) {
                    console.error('Error destroying session:', destroyErr);
                    return res.status(500).json({ error: 'Failed to destroy session' });
                }
                
                res.json({ ok: true });
            });
        });
    } catch (error) {
        console.error('Demo logout error:', error);
        res.status(500).json({ error: 'Demo logout failed' });
    }
});

// Debug endpoint for session inspection
router.get('/debug/session', (req, res) => {
    const debugInfo = {
        origin: req.headers.origin || 'NO ORIGIN',
        hasCookieHeader: !!req.headers.cookie,
        cookieHeader: req.headers.cookie ? 'PRESENT' : 'MISSING',
        cookiesParsed: req.cookies ? Object.keys(req.cookies) : [],
        sessionID: req.sessionID || 'NO SESSION ID',
        passportUser: req.user?.username || null,
        passportUserId: req.user?._id || req.user?.id || null,
        isAuthenticated: typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false,
        sessionKeys: req.session ? Object.keys(req.session) : [],
        passportSessionKey: req.session?.passport || null
    };
    
    console.log('=== DEBUG SESSION ENDPOINT ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('==============================');
    
    res.json(debugInfo);
})

// Canonical endpoint to get current authenticated user from session
router.get('/me', (req, res) => {
    const authenticated = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
    const user = req.user || null;
    
    console.log('🔍 [AUTH ME] Request received');
    console.log('🔍 [AUTH ME] authenticated:', authenticated);
    console.log('🔍 [AUTH ME] user:', user ? { username: user.username, id: user._id || user.id } : null);
    
    res.json({
        authenticated: authenticated === true,
        user: user ? { 
            username: user.username, 
            id: user._id || user.id 
        } : null
    });
})

// Diagnostic endpoint to check authentication status after logout
router.get('/debug/whoami', (req, res) => {
    const authenticated = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
    const user = req.user || null;
    const sessionID = req.sessionID || null;
    
    console.log('🔍 [DEBUG WHOAMI] Request received');
    console.log('🔍 [DEBUG WHOAMI] authenticated:', authenticated);
    console.log('🔍 [DEBUG WHOAMI] user:', user);
    console.log('🔍 [DEBUG WHOAMI] sessionID:', sessionID);
    
    res.json({
        authenticated: authenticated,
        user: user ? { username: user.username, id: user._id || user.id } : null,
        sessionID: sessionID
    });
})

router.post('/logout', (req, res) => {
    console.log('🔴 [LOGOUT_START] ============================================');
    console.log('🔴 [LOGOUT_START] Method:', req.method);
    console.log('🔴 [LOGOUT_START] URL:', req.url);
    console.log('🔴 [LOGOUT_START] Original URL:', req.originalUrl);
    console.log('🔴 [LOGOUT_START] Origin:', req.headers.origin || 'NO ORIGIN');
    console.log('🔴 [LOGOUT_START] Cookie header present:', !!req.headers.cookie);
    console.log('🔴 [LOGOUT_START] Cookie header:', req.headers.cookie || 'NO COOKIE HEADER');
    console.log('🔴 [LOGOUT_START] Session ID:', req.sessionID || 'NO SESSION ID');
    console.log('🔴 [LOGOUT_START] req.user:', req.user ? { username: req.user.username, id: req.user._id } : 'NO USER');
    console.log('🔴 [LOGOUT_START] req.isAuthenticated exists:', typeof req.isAuthenticated === 'function');
    console.log('🔴 [LOGOUT_START] req.isAuthenticated():', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'NOT AVAILABLE');
    
    // Flag to prevent double response sending
    let responseSent = false;
    const sendResponse = (success, error = null) => {
        if (responseSent) {
            console.warn('⚠️ [LOGOUT] Attempted to send response twice, ignoring');
            return;
        }
        responseSent = true;
        
        if (error) {
            console.error('❌ [LOGOUT_RESPONSE_SENT] Sending error response:', error);
            res.status(500).json({ success: false, error: error });
        } else {
            console.log('🔴 [LOGOUT_BEFORE_CLEAR_COOKIE] About to clear cookie: user_sid');
            console.log('🔴 [LOGOUT_BEFORE_CLEAR_COOKIE] Cookie attributes:', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/'
            });
            
            // Clear the session cookie with the SAME attributes used when setting it
            res.clearCookie('user_sid', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/'
            });
            
            console.log('🟢 [LOGOUT_BEFORE_CLEAR_COOKIE] Cookie cleared');
            console.log('🔴 [LOGOUT_RESPONSE_SENT] About to send response');
            console.log('🔴 [LOGOUT_RESPONSE_SENT] Response will be: { success: true }');
            
            res.json({ success: true });
            
            console.log('🟢 [LOGOUT_RESPONSE_SENT] Response sent successfully');
            console.log('🔴 [LOGOUT_START] ============================================');
        }
    };
    
    console.log('🔴 [LOGOUT_BEFORE_LOGOUT_CALL] About to call req.logout()');
    
    // Use Passport's req.logout() for proper cleanup
    // Handle both callback and no-callback versions of Passport
    try {
        if (req.logout.length === 0) {
            // req.logout() doesn't accept callback (newer Passport versions)
            console.log('🟢 [LOGOUT_AFTER_LOGOUT_CALL] req.logout() called synchronously (no callback)');
            req.logout();
        } else {
            // req.logout() accepts callback (older Passport versions)
            req.logout((err) => {
                if (err) {
                    console.error('❌ [LOGOUT_AFTER_LOGOUT_CALL] req.logout() callback error:', err);
                } else {
                    console.log('🟢 [LOGOUT_AFTER_LOGOUT_CALL] req.logout() callback executed successfully');
                    console.log('🟢 [LOGOUT_AFTER_LOGOUT_CALL] req.user after logout:', req.user || 'NO USER (expected)');
                    console.log('🟢 [LOGOUT_AFTER_LOGOUT_CALL] req.isAuthenticated() after logout:', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'NOT AVAILABLE');
                }
                
                // Continue with session destroy regardless of logout callback result
                destroySession();
            });
            // If callback version, return early - destroySession will be called from callback
            return;
        }
    } catch (err) {
        console.error('❌ [LOGOUT_AFTER_LOGOUT_CALL] req.logout() threw error:', err);
        // Continue with session destroy even if logout fails
    }
    
    // Function to destroy session (called after logout)
    const destroySession = () => {
        console.log('🔴 [LOGOUT_BEFORE_SESSION_DESTROY] About to call req.session.destroy()');
        
        // Ensure we have a session to destroy
        if (!req.session) {
            console.warn('⚠️ [LOGOUT_BEFORE_SESSION_DESTROY] No session to destroy');
            sendResponse(true);
            return;
        }
        
        // Destroy the session with timeout safeguard
        const destroyTimeout = setTimeout(() => {
            if (!responseSent) {
                console.error('❌ [LOGOUT_AFTER_SESSION_DESTROY] Session destroy callback timeout - forcing response');
                sendResponse(true); // Send success even if destroy hangs - session may still be cleared
            }
        }, 5000); // 5 second timeout
        
        req.session.destroy((destroyErr) => {
            clearTimeout(destroyTimeout);
            
            if (destroyErr) {
                console.error('❌ [LOGOUT_AFTER_SESSION_DESTROY] Session destroy callback error:', destroyErr);
                console.error('❌ [LOGOUT_AFTER_SESSION_DESTROY] Error details:', {
                    message: destroyErr.message,
                    stack: destroyErr.stack
                });
                sendResponse(false, 'Failed to destroy session');
                return;
            }
            
            console.log('🟢 [LOGOUT_AFTER_SESSION_DESTROY] Session destroy callback executed successfully');
            console.log('🟢 [LOGOUT_AFTER_SESSION_DESTROY] Session ID after destroy:', req.sessionID || 'NO SESSION ID (expected)');
            console.log('🟢 [LOGOUT_AFTER_SESSION_DESTROY] req.session exists:', !!req.session);
            
            sendResponse(true);
        });
    };
    
    // If logout was synchronous, proceed to destroy session
    destroySession();
})

// Simple login handler
router.post('/login', 
    userBruteforce.prevent, 
    passport.authenticate('local', { failWithError: true }),
    
    // Success handler - called when authentication succeeds
    (req, res) => {
        console.log('🟢 [LOGIN] ============================================');
        console.log('🟢 [LOGIN] Authentication successful');
        console.log('🟢 [LOGIN] User:', req.user.username);
        console.log('🟢 [LOGIN] Session ID:', req.sessionID);
        console.log('🟢 [LOGIN] Origin:', req.headers.origin);
        console.log('🟢 [LOGIN] Cookie header before logIn:', req.headers.cookie || 'NO COOKIE');
        
        // Reset brute force counter
        req.brute.reset();
        
        // Establish session
        req.logIn(req.user, (err) => {
            if (err) {
                console.error('❌ [LOGIN] req.logIn() failed:', err);
                return res.status(500).json({ error: 'Failed to establish session' });
            }
            
            console.log('🟢 [LOGIN] req.logIn() successful');
            console.log('🟢 [LOGIN] Session after logIn:', {
                sessionID: req.sessionID,
                passport: req.session.passport,
                keys: Object.keys(req.session)
            });
            console.log('🟢 [LOGIN] req.isAuthenticated():', req.isAuthenticated());
            
            // Save session to MongoDB, then respond
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('❌ [LOGIN] Session save failed:', saveErr);
                    return res.status(500).json({ error: 'Failed to save session' });
                }
                
                console.log('🟢 [LOGIN] Session saved to MongoDB');
                
                // Check Set-Cookie header
                const setCookieHeader = res.getHeader('set-cookie');
                console.log('🟢 [LOGIN] Set-Cookie header:', setCookieHeader || 'NOT SET YET');
                console.log('🟢 [LOGIN] Response will be sent with cookie');
                
                // Check if account is locked
                if (req.user.locked_out) {
                    console.log('⚠️ [LOGIN] Account is locked');
                    console.log('🟢 [LOGIN] ============================================');
                    return res.status(202).json({ error: 'Account locked' });
                }
                
                console.log('✅ [LOGIN] Login complete - sending 200 response');
                console.log('🟢 [LOGIN] ============================================');
                
                // Success - send 200
                res.status(200).json({ success: true });
            });
        });
    },
    
    // Error handler - called when authentication fails
    (err, req, res, next) => {
        // Log the actual error server-side for debugging
        console.error('[AUTH] Login error:', err.message || err);
        
        // Return safe error message to client (don't expose internal errors)
        // Passport sends specific messages like 'Invalid username or password' from authenticateUser
        const safeMessage = err.message && err.message.includes('Invalid username or password') 
            ? 'Invalid username or password'
            : 'Invalid username or password'; // Always return same message for security
        
        res.status(401).json({ error: safeMessage });
    }
);

module.exports = router;