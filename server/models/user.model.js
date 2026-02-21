const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
        match: [/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Username must start with a letter and contain only letters, numbers, and underscores'],
        lowercase: true, // Always store username in lowercase
        unique: true // Case-insensitive uniqueness (since stored lowercase)
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
    unread: [{type: String}],
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
    },
    isDemo: {
        type: Boolean,
        default: false,
    }
}, { collection: 'User' });

// Pre-save hook: Ensure username is lowercase (backup to schema lowercase option)
userSchema.pre('save', function(next) {
    if (this.isModified('username') && this.username) {
        this.username = this.username.toLowerCase();
        // Keep usernameLower in sync for backward compatibility during migration
        this.usernameLower = this.username;
    } else if (!this.usernameLower && this.username) {
        this.usernameLower = this.username.toLowerCase();
    }
    next();
});

// Handle findOneAndUpdate operations (which bypass pre-save hooks)
userSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
    const update = this.getUpdate();
    if (update && (update.$set || update.username)) {
        const username = update.$set?.username || update.username;
        if (username && typeof username === 'string') {
            if (!update.$set) update.$set = {};
            update.$set.username = username.toLowerCase();
            update.$set.usernameLower = username.toLowerCase(); // Keep in sync
        }
    }
    next();
});

// Create index for case-insensitive username lookups (sparse to allow nulls for existing users)
// Keep usernameLower index for backward compatibility during migration
userSchema.index({ usernameLower: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PennThriftBackend', userSchema, 'User');