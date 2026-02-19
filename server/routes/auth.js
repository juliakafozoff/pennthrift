
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

router.post('/', async(req, res) =>{
    if (req.session.user && req.cookies.user_sid) {
        res.json([true, req.session.user])
    } else {
        res.json([false, null])
    }
});

router.post('/register', async(request, response) =>{
    const {username, password} = request.body;

    const user = await User.exists({username:username});
    try{
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username:username,
                password: hashedPassword,
            });
            
            console.log(hashedPassword)
            newUser.save()
            .then((data) =>{
                request.session.user = username;
                // Explicitly save the session before responding
                request.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        return response.status(500).json("Error: Failed to save session");
                    }
                    response.json("successful");
                });
            })
            .catch((error) =>{
                response.json(error);
            });
            
        } else {
            response.json("Error: User is already registered");
        }
    }catch(err){

    }
    
    
});

router.get('/user', (req, res) => {
    try{
        const user = req.session.user;
        user ? res.json(user) : res.json(null)

    }catch(err){

    }
})

router.post('/logout', (req, res) =>{
    req.session.destroy();
    res.json('Logged out')
})

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
        console.log(err);
        res.json(err);
    }
);

module.exports = router;