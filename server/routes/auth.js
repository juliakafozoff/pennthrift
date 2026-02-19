
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

// Auth check endpoint - uses Passport sessions correctly
router.get('/', async(req, res) =>{
    // Detailed logging for auth check
    console.log('=== AUTH CHECK REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Origin:', req.headers.origin);
    console.log('Cookie Header:', req.headers.cookie || 'NONE');
    console.log('Session ID:', req.sessionID);
    console.log('Session Keys:', req.session ? Object.keys(req.session) : 'NO SESSION');
    console.log('Passport User:', req.user || 'NOT SET');
    console.log('Is Authenticated:', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'N/A');
    console.log('Cookies Parsed:', req.cookies);
    console.log('========================');
    
    // Use Passport's isAuthenticated() as single source of truth
    const authenticated = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
    
    // Return safe user fields if authenticated
    if (authenticated && req.user) {
        const safeUserFields = {
            username: req.user.username,
            id: req.user._id || req.user.id
        };
        res.json({ authenticated: true, user: safeUserFields });
    } else {
        res.json({ authenticated: false, user: null });
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

router.post('/register', async(request, response) =>{
    // Detailed logging for register request
    console.log('=== REGISTER REQUEST ===');
    console.log('Method:', request.method);
    console.log('URL:', request.originalUrl);
    console.log('Origin:', request.headers.origin);
    console.log('Cookie Header:', request.headers.cookie || 'NONE');
    console.log('Session ID:', request.sessionID);
    console.log('Session Keys (before):', request.session ? Object.keys(request.session) : 'NO SESSION');
    console.log('========================');
    
    const {username, password} = request.body;

    const user = await User.exists({username:username});
    try{
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username:username,
                password: hashedPassword,
            });
            
            newUser.save()
            .then((data) =>{
                // Use Passport's req.logIn() to establish session after registration
                request.logIn(data, (err) => {
                    if (err) {
                        console.error('=== REGISTER PASSPORT LOGIN ERROR ===');
                        console.error('Error:', err);
                        console.error('Session ID:', request.sessionID);
                        console.error('====================================');
                        return response.status(500).json("Error: Failed to establish session");
                    }
                    
                    // Log session after logIn
                    console.log('=== REGISTER PASSPORT LOGIN SUCCESS ===');
                    console.log('Session ID:', request.sessionID);
                    console.log('Session Keys (after logIn):', Object.keys(request.session));
                    console.log('Passport session:', request.session.passport);
                    console.log('Is Authenticated:', request.isAuthenticated());
                    console.log('Passport User:', request.user?.username);
                    
                    // Explicitly save session to MongoDB before responding
                    request.session.save((saveErr) => {
                        if (saveErr) {
                            console.error('=== REGISTER SESSION SAVE ERROR ===');
                            console.error('Error:', saveErr);
                            console.error('Session ID:', request.sessionID);
                            console.error('==================================');
                            return response.status(500).json("Error: Failed to save session");
                        }
                        
                        // Check Set-Cookie header before sending response
                        const setCookieHeader = response.getHeader('set-cookie');
                        console.log('Set-Cookie Header:', setCookieHeader || 'NOT SET YET');
                        console.log('Session saved to MongoDB successfully');
                        console.log('======================================');
                        
                        response.json("successful");
                    });
                });
            })
            .catch((error) =>{
                console.error('=== REGISTER USER SAVE ERROR ===');
                console.error('Error:', error);
                console.error('================================');
                response.json(error);
            });
            
        } else {
            response.json("Error: User is already registered");
        }
    }catch(err){
        console.error('=== REGISTER ERROR ===');
        console.error('Error:', err);
        console.error('======================');
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

router.post('/logout', (req, res) =>{
    // Use Passport's req.logout() for proper cleanup
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.json('Logged out');
        });
    });
})

router.post('/login', userBruteforce.prevent, passport.authenticate('local', { failWithError: true }),

    function(req, res, next) {
        // Detailed logging for login request
        console.log('=== LOGIN REQUEST ===');
        console.log('Method:', req.method);
        console.log('URL:', req.originalUrl);
        console.log('Origin:', req.headers.origin);
        console.log('Cookie Header:', req.headers.cookie || 'NONE');
        console.log('Session ID:', req.sessionID);
        console.log('Session Keys (before):', req.session ? Object.keys(req.session) : 'NO SESSION');
        console.log('Passport User:', req.user || 'NOT SET');
        console.log('Is Authenticated (before logIn):', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'N/A');
        console.log('====================');
        
        // Reset brute force counter on successful authentication
        // This must be called before responding to clear any rate limiting
        req.brute.reset();
        
        // Use Passport's req.logIn() to establish session
        // This properly serializes the user and stores in session
        req.logIn(req.user, (err) => {
            if (err) {
                console.error('=== PASSPORT LOGIN ERROR ===');
                console.error('Error:', err);
                console.error('Session ID:', req.sessionID);
                console.error('===========================');
                return res.status(500).send({ error: 'Failed to establish session' });
            }
            
            // Log session after logIn
            console.log('=== PASSPORT LOGIN SUCCESS ===');
            console.log('Session ID:', req.sessionID);
            console.log('Session Keys (after logIn):', Object.keys(req.session));
            console.log('Passport session:', req.session.passport);
            console.log('Is Authenticated (after logIn):', req.isAuthenticated());
            console.log('Passport User:', req.user?.username);
            
            // Explicitly save session to MongoDB before responding
            // req.logIn() serializes but we need to ensure it's saved to store
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('=== SESSION SAVE ERROR AFTER LOGIN ===');
                    console.error('Error:', saveErr);
                    console.error('Session ID:', req.sessionID);
                    console.error('=====================================');
                    return res.status(500).send({ error: 'Failed to save session' });
                }
                
                // Check Set-Cookie header before sending response
                const setCookieHeader = res.getHeader('set-cookie');
                console.log('Set-Cookie Header:', setCookieHeader || 'NOT SET YET');
                console.log('Session saved to MongoDB successfully');
                console.log('=============================');
                
                if (!req.user.locked_out) {
                    const currentTimestamp = moment().unix(); // in seconds
                    const currentDatetime = moment(currentTimestamp * 1000).format(
                            'YYYY-MM-DD HH:mm:ss'
                    );
                    res.status(200).send({ data: 'success', user: req.user, time: currentDatetime });
                } else {
                    res.status(202).send({ data: 'lockedout', user: req.user });
                }
            });
        });
    },
    function(err, req, res, next) {
        // handle error
        console.log('=== LOGIN ERROR ===');
        console.log('Error:', err);
        console.log('==================');
        res.json(err);
    }
);

module.exports = router;