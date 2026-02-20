const localStrategy = require('passport-local').Strategy;
const User          = require('./models/user.model');
const bcrypt        = require('bcrypt')

function initialize(passport){

    const authenticateUser = async (username, password, done) =>{
        // Support username-or-email login: try username first, then email
        // Frontend sends both username and email fields, but we use username parameter
        // Normalize username to lowercase for lookup (usernames are stored lowercase)
        const normalizedUsername = username ? username.toLowerCase() : username;
        // Explicitly select password field since schema has select: false
        User.findOne({username:normalizedUsername}).select('+password').exec((err, user) => {
            if (err) {
                console.error('[AUTH] Database error during login:', err);
                return done(err);
            }
    
            // Defensive check: user doesn't exist
            if (!user) {
                console.log('[AUTH] Login attempt failed: User not found:', username);
                return done(null, false, {message:'Invalid username or password'});
            }
            
            // Defensive check: password hash is missing (should never happen, but safety first)
            if (!user.password) {
                console.error('[AUTH] CRITICAL: User exists but password hash is missing:', username);
                return done(new Error('Authentication system error. Please contact support.'), false);
            }
            
            // Defensive check: password from request is missing
            if (!password) {
                console.log('[AUTH] Login attempt failed: No password provided');
                return done(null, false, {message:'Invalid username or password'});
            }
            
            // Now safe to compare
            bcrypt.compare(password, user.password, (err, res) => {
                if (err) {
                    console.error('[AUTH] bcrypt.compare error:', err);
                    return done(err);
                }
    
                if (res === false) {
                    console.log('[AUTH] Login attempt failed: Incorrect password for user:', username);
                    return done(null, false, {message:'Invalid username or password'});
                }
    
                // Success - create safe user object without password
                const safeUser = {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    venmo: user.venmo,
                    bio: user.bio,
                    class_year: user.class_year,
                    interests: user.interests,
                    profile_pic: user.profile_pic,
                    date: user.date,
                    locked_out: user.locked_out,
                    last_login: user.last_login
                };
                
                console.log('[AUTH] Login successful for user:', username);
                return done(null, safeUser);
            });
        });
    }    
    passport.use(new localStrategy(authenticateUser));
    passport.serializeUser( (user, done) =>{
        done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
       // Explicitly exclude password when deserializing
       User.findById(id).select('-password').exec((err, user) => {
            if (err) {
                console.error('[AUTH] Deserialize error:', err);
                return done(err, null);
            }
            // Return safe user object without password
            done(null, user);
        });
    });
}

module.exports = initialize;