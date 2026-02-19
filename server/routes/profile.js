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

module.exports = router;