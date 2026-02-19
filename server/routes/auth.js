
const express       = require('express');
const router        = express.Router();
const User          = require('../models/user.model');
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
    
    // Check if user already exists
    const userExists = await User.exists({ username });
    if (userExists) {
        return res.status(409).json('Error: User is already registered');
    }
    
    try {
        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
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

router.post('/logout', (req, res) => {
    console.log('🔴 [LOGOUT] ============================================');
    console.log('🔴 [LOGOUT] Logout request received');
    console.log('🔴 [LOGOUT] Session ID:', req.sessionID || 'NO SESSION ID');
    console.log('🔴 [LOGOUT] req.user:', req.user ? { username: req.user.username, id: req.user._id } : 'NO USER');
    console.log('🔴 [LOGOUT] req.isAuthenticated():', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'NOT AVAILABLE');
    console.log('🔴 [LOGOUT] Cookie header:', req.headers.cookie || 'NO COOKIE HEADER');
    
    // Store session ID for logging after destroy
    const sessionIdBefore = req.sessionID;
    
    // Use Passport's req.logout() for proper cleanup
    req.logout((err) => {
        if (err) {
            console.error('❌ [LOGOUT] req.logout() error:', err);
        } else {
            console.log('🟢 [LOGOUT] req.logout() successful');
        }
        
        // Destroy the session
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                console.error('❌ [LOGOUT] Session destroy error:', destroyErr);
                return res.status(500).json({ success: false, error: 'Failed to destroy session' });
            }
            
            console.log('🟢 [LOGOUT] Session destroyed successfully');
            console.log('🔴 [LOGOUT] Session ID after destroy:', req.sessionID || 'NO SESSION ID');
            
            // Clear the session cookie with the SAME attributes used when setting it
            res.clearCookie('user_sid', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/'
            });
            
            console.log('🟢 [LOGOUT] Cookie cleared');
            console.log('🔴 [LOGOUT] ============================================');
            
            res.json({ success: true });
        });
    });
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
        // Passport sends 401 for auth failures
        res.status(401).json({ error: err.message || 'Authentication failed' });
    }
);

module.exports = router;