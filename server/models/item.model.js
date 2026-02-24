const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
    name: {
        type: String,
        required: true,
        maxLength: 100,
    },
    description: {
        type: String,
        required: true,
        maxLength: 1000,
    },
    image: {
        type: String,
        required: true,
    },
    category:{
        type: String,
        enum: ['Dorm & Home', 'Electronics', 'Books', 'Apparel', 'Tickets & Events', 'Other'],
    },
    condition: {
        type: String,
    },
    price: {
        type:Number
    },
    owner: {
        type: String,
        required: true,
    },
    requests_for: [{type: Schema.Types.ObjectId, ref: 'Request'}],
    to_sell: {
        type: Boolean,
        required: true,
    },
    to_trade: {
        type: Boolean,
        required: true,
    },
    available: Boolean,
    views: {
        type: Number,
        default: 0,
    },
}, { collection: 'Item' });

module.exports = mongoose.model('Item', itemSchema);