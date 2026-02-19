
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
    freeRetries: 1,
    minWait: 1*60*1000, // 5 minutes
    maxWait: 60*60*1000, // 1 hour,
    failCallback: lockoutCallback,
});

// Auth check endpoint - simplified to use session OR passport
router.post('/', async(req, res) =>{
    // Detailed logging for auth check
    console.log('=== AUTH CHECK REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Origin:', req.headers.origin);
    console.log('Cookie Header:', req.headers.cookie || 'NONE');
    console.log('Session ID:', req.sessionID);
    console.log('Session Keys:', req.session ? Object.keys(req.session) : 'NO SESSION');
    console.log('Session User:', req.session?.user || 'NOT SET');
    console.log('Passport User:', req.user || 'NOT SET');
    console.log('Is Authenticated:', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'N/A');
    console.log('Cookies Parsed:', req.cookies);
    console.log('========================');
    
    // Simplified check: use session.user OR passport authentication
    const isAuthenticated = req.session?.user || (typeof req.isAuthenticated === 'function' && req.isAuthenticated());
    const username = req.session?.user || req.user?.username;
    
    if (isAuthenticated && username) {
        res.json([true, username]);
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
                request.session.user = username;
                // Explicitly save the session before responding
                request.session.save((err) => {
                    if (err) {
                        console.error('=== REGISTER SESSION SAVE ERROR ===');
                        console.error('Error:', err);
                        console.error('Session ID:', request.sessionID);
                        console.error('===================================');
                        return response.status(500).json("Error: Failed to save session");
                    }
                    
                    // Log session after save
                    console.log('=== REGISTER SESSION SAVED ===');
                    console.log('Session ID:', request.sessionID);
                    console.log('Session User:', request.session.user);
                    console.log('Session Keys (after):', Object.keys(request.session));
                    
                    // Check Set-Cookie header before sending response
                    const setCookieHeader = response.getHeader('set-cookie');
                    console.log('Set-Cookie Header:', setCookieHeader || 'NOT SET YET');
                    console.log('================================');
                    
                    response.json("successful");
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
        const user = req.session.user;
        user ? res.json(user) : res.json(null)

    }catch(err){

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
        sessionUser: req.session?.user || null,
        passportUser: req.user?.username || null,
        isAuthenticated: typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false,
        sessionKeys: req.session ? Object.keys(req.session) : []
    };
    
    console.log('=== DEBUG SESSION ENDPOINT ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('==============================');
    
    res.json(debugInfo);
})

router.post('/logout', (req, res) =>{
    req.session.destroy();
    res.json('Logged out')
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
        console.log('Is Authenticated:', typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'N/A');
        console.log('====================');
        
        req.session.user = req.user.username;
        req.brute.reset();
        
        // Explicitly save the session before responding
        req.session.save((err) => {
            if (err) {
                console.error('=== SESSION SAVE ERROR ===');
                console.error('Error:', err);
                console.error('Session ID:', req.sessionID);
                console.error('========================');
                return res.status(500).send({ error: 'Failed to save session' });
            }
            
            // Log session after save
            console.log('=== SESSION SAVED ===');
            console.log('Session ID:', req.sessionID);
            console.log('Session User:', req.session.user);
            console.log('Session Keys (after):', Object.keys(req.session));
            
            // Check Set-Cookie header before sending response
            const setCookieHeader = res.getHeader('set-cookie');
            console.log('Set-Cookie Header:', setCookieHeader || 'NOT SET YET');
            console.log('===================');
            
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