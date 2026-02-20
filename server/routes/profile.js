const User = require('../models/user.model');
const Item = require('../models/item.model')
const router = require('express').Router();

// Helper function to sanitize profile_pic URLs
// Converts localhost URLs to relative paths or fixes them
const sanitizeProfilePic = (profilePic) => {
    if (!profilePic || typeof profilePic !== 'string') {
        return profilePic;
    }
    
    // If it contains localhost or 127.0.0.1, extract relative path
    if (profilePic.includes('localhost') || profilePic.includes('127.0.0.1')) {
        const match = profilePic.match(/\/api\/file\/[^?#]+/);
        if (match) {
            return match[0]; // Return relative path like /api/file/filename.png
        }
        // If no match, return empty string (invalid URL)
        return '';
    }
    
    // If it's already a relative path, return as-is
    if (profilePic.startsWith('/api/')) {
        return profilePic;
    }
    
    // If it's a valid absolute URL (not localhost), return as-is
    return profilePic;
};

// Helper to sanitize user object before sending
const sanitizeUser = (user) => {
    if (!user) return user;
    
    // Convert to plain object if it's a Mongoose document
    const userObj = user.toObject ? user.toObject() : user;
    
    // Sanitize profile_pic
    if (userObj.profile_pic) {
        userObj.profile_pic = sanitizeProfilePic(userObj.profile_pic);
    }
    
    // Ensure password is never included
    delete userObj.password;
    
    return userObj;
};

// get all profiles/users
router.route('/').get((req, res) => {
    // using .find() without a parameter will match on all user instances
    User.find().select('-password')
        .then(allUsers => {
            // Sanitize profile_pic URLs for all users
            const sanitizedUsers = Array.isArray(allUsers) 
                ? allUsers.map(user => sanitizeUser(user))
                : [];
            res.json(sanitizedUsers);
        })
        .catch(err => res.status(400).json('Error! ' + err))
});

// get profile/ user info by username
router.route('/:username').get((req, res) => {
    User.findOne({username: req.params.username}).select('-password')
    .then(user => {
        // Sanitize profile_pic URL before sending
        const sanitizedUser = sanitizeUser(user);
        res.json(sanitizedUser);
    })
    .catch(err => res.status(400).json('Error! ' + err))
});

// delete profile/user by username
router.route('/delete/:username').delete((req, res) => {
    User.deleteOne({ username: req.params.username })
        .then(success => res.json('Success! User deleted.'))
        .catch(err => res.status(400).json('Error! ' + err))
});

// edit profile/user info by username
router.route('/edit/:username').put((req, res) => {
    // Sanitize profile_pic before saving if present
    if (req.body.profile_pic) {
        req.body.profile_pic = sanitizeProfilePic(req.body.profile_pic);
    }
    
    User.findOneAndUpdate({username: req.params.username }, req.body)
        .then(user => res.json('Success! User updated.'))
        .catch(err => res.status(400).json('Error! ' + err))
});

//add items under a user 
router.route('/item/new').post((req, res) => {
    User.findOne({username:req.body.username})
        .then(user => {
            const newItem = new Item(req.body);
            newItem.save().then().catch((err) => res.status(400).json(err));
            User.findOneAndUpdate(
                { _id:user._id },
                { $addToSet: { items:newItem } }
            ).exec();
            res.json('Item added succesfully');
        })
        .catch(err => res.status(400).json('Error! ' + err))
    
})

router.route('/favourites/update').post(( req, res) => {
    const { itemID, username } = req.body;
    if(!itemID || !username){
        return res.status(400).json('Error! itemID and username are required');
    }
    
    User.findOne({username:username}).then( user => {
        if(!user){
            return res.status(404).json('Error! User not found');
        }
        
        Item.findOne({_id:itemID}).then( item => {
            if(!item){
                return res.status(404).json('Error! Item not found');
            }
            
            const remove = user.favourites.some(fav => fav.toString() === itemID.toString());
            
            if(remove){
                // Remove from favourites
                User.findOneAndUpdate(
                    { username:username },
                    { $pull: {favourites: itemID } }
                ).then(() => {
                    // Return updated user with populated favourites
                    User.findOne({username:username}).select('-password').populate('favourites').then( updatedUser => {
                        res.json(updatedUser.favourites);
                    }).catch(err => res.status(400).json('Error! ' + err));
                }).catch(err => res.status(400).json('Error! ' + err));
            } else {
                // Add to favourites
                User.findOneAndUpdate(
                    { username:username },
                    { $addToSet: {favourites: itemID } }
                ).then(() => {
                    // Return updated user with populated favourites
                    User.findOne({username:username}).select('-password').populate('favourites').then( updatedUser => {
                        res.json(updatedUser.favourites);
                    }).catch(err => res.status(400).json('Error! ' + err));
                }).catch(err => res.status(400).json('Error! ' + err));
            }
        }).catch(err => res.status(400).json('Error! ' + err));
    }).catch(err => res.status(400).json('Error! ' + err));
});

router.route('/favourites').post( (req, res) => {
    const { username } = req.body;
    if(!username){
        return res.status(400).json('Error! username is required');
    }
    User.findOne({username:username}).select('-password').populate('favourites').then( user => {
        if(!user){
            return res.json([]);
        }
        res.json(user.favourites || []);
    }).catch(err => res.status(400).json('Error! ' + err));
})

// get chats of user
router.route('/chats/:username').get((req, res) => {
    try{
        User.findOne({ username: req.params.username }, {username: 1, chats: 1})
        .populate({
            path:'chats',
            options:{sort:{ updatedAt: -1 }}
         }).exec((err, user) => {
            res.json(user.chats);
        })
    }catch{

    }
    
});



// get items of user
router.route('/items/:username').get((req, res) => {
    try{
        User.findOne({ username: req.params.username }, {username: 1, items: 1})
       .populate('items').exec((err, user) => {
           res.json(user);
       })

    }catch{

    }
});

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
    'admin', 'support', 'pennthrift', 'login', 'signup', 'register',
    'messages', 'profile', 'settings', 'api', 'store', 'analytics',
    'favourites', 'favorites', 'user', 'users', 'root', 'system'
].map(u => u.toLowerCase());

// Change username endpoint
router.route('/username').put((req, res) => {
    // Check authentication
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { username } = req.body;
    const currentUser = req.user;

    // Validation: username is required
    if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username is required' });
    }

    const trimmedUsername = username.trim();

    // Validation: length (3-20 characters)
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    // Validation: must start with a letter
    if (!/^[a-zA-Z]/.test(trimmedUsername)) {
        return res.status(400).json({ error: 'Username must start with a letter' });
    }

    // Validation: only letters, numbers, and underscores
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedUsername)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validation: check reserved words (case-insensitive)
    const usernameLower = trimmedUsername.toLowerCase();
    if (RESERVED_USERNAMES.includes(usernameLower)) {
        return res.status(400).json({ error: 'This username is reserved and cannot be used' });
    }

    // Check if username is the same (no change needed)
    if (currentUser.username && currentUser.username.toLowerCase() === usernameLower) {
        return res.status(200).json({
            username: currentUser.username,
            usernameLastChangedAt: currentUser.usernameLastChangedAt || null,
            message: 'Username unchanged'
        });
    }

    // Check cooldown: 30 days
    const COOLDOWN_DAYS = 30;
    const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    
    if (currentUser.usernameLastChangedAt) {
        const lastChanged = new Date(currentUser.usernameLastChangedAt);
        const nextChangeDate = new Date(lastChanged.getTime() + COOLDOWN_MS);
        const now = new Date();

        if (now < nextChangeDate) {
            return res.status(429).json({
                error: 'Username can only be changed once every 30 days',
                nextUsernameChangeAt: nextChangeDate.toISOString(),
                daysRemaining: Math.ceil((nextChangeDate - now) / (24 * 60 * 60 * 1000))
            });
        }
    }

    // Check uniqueness: case-insensitive via usernameLower
    User.findOne({ usernameLower: usernameLower })
        .then(existingUser => {
            if (existingUser && existingUser._id.toString() !== currentUser._id.toString()) {
                return res.status(409).json({ error: 'Username is already taken' });
            }

            // Update username
            const updateData = {
                username: trimmedUsername,
                usernameLower: usernameLower,
                usernameLastChangedAt: new Date()
            };

            User.findByIdAndUpdate(
                currentUser._id,
                { $set: updateData },
                { new: true, runValidators: true }
            )
            .select('-password')
            .then(updatedUser => {
                if (!updatedUser) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Calculate next change date
                const nextChangeDate = new Date(updatedUser.usernameLastChangedAt.getTime() + COOLDOWN_MS);

                res.json({
                    username: updatedUser.username,
                    usernameLastChangedAt: updatedUser.usernameLastChangedAt,
                    nextUsernameChangeAt: nextChangeDate.toISOString(),
                    message: 'Username updated successfully'
                });
            })
            .catch(err => {
                console.error('Error updating username:', err);
                if (err.code === 11000) {
                    // Duplicate key error (unique constraint violation)
                    return res.status(409).json({ error: 'Username is already taken' });
                }
                res.status(400).json({ error: 'Failed to update username: ' + err.message });
            });
        })
        .catch(err => {
            console.error('Error checking username uniqueness:', err);
            res.status(500).json({ error: 'Server error while checking username availability' });
        });
});

module.exports = router;