const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 25,
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

module.exports = mongoose.model('PennThriftBackend', userSchema, 'User');