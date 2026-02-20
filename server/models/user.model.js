const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
        match: [/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Username must start with a letter and contain only letters, numbers, and underscores']
    },
    usernameLower: {
        type: String,
        required: false, // Will be populated by pre-save hook for backward compatibility
        lowercase: true
    },
    usernameLastChangedAt: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        required: true,
        minLength: 1,
        select: false, // Never include password in queries by default
    },
    email: {
        type: String,
    },
    venmo: {
        type: String,
        minLength: 5,
        maxLength: 16,
    },
    bio: {
        type: String
    },
    class_year: {
        type: Number
    },
    interests: [{type: String}],
    profile_pic: {
        type:String
    },
    date:{
        type: Date,
        default:Date.now,
    },
    favourites: [{type: Schema.Types.ObjectId, ref: 'Item'}],
    items: [{type: Schema.Types.ObjectId, ref: 'Item'}],
    unread:Array,
    reviews_for: [{type: Schema.Types.ObjectId, ref: 'Review'}],
    reviews_to: [{type: Schema.Types.ObjectId, ref: 'Review'}],
    requests_for: [{type: Schema.Types.ObjectId, ref: 'Request'}],
    requests_to: [{type: Schema.Types.ObjectId, ref: 'Request'}],
    chats: [{type: Schema.Types.ObjectId, ref: 'Messages'}],
    pending_notifs: [{type: Schema.Types.ObjectId, ref: 'Notification'}],
    profile_views: {
        type: [{type: Number}], default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
    last_login: {
        type: Date,
        default: Date.now,
    },
    locked_out: {
        type: Boolean,
        default: false,
    }
}, { collection: 'User' });

// Pre-save hook: Automatically populate usernameLower for backward compatibility
userSchema.pre('save', function(next) {
    if (this.isModified('username') || !this.usernameLower) {
        this.usernameLower = this.username ? this.username.toLowerCase() : null;
    }
    next();
});

// Handle findOneAndUpdate operations (which bypass pre-save hooks)
userSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
    const update = this.getUpdate();
    if (update && (update.$set || update.username)) {
        const username = update.$set?.username || update.username;
        if (username) {
            if (!update.$set) update.$set = {};
            update.$set.usernameLower = username.toLowerCase();
        }
    }
    next();
});

// Create index for case-insensitive username lookups (sparse to allow nulls for existing users)
userSchema.index({ usernameLower: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PennThriftBackend', userSchema, 'User');