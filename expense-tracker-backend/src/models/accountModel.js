const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    balance: { 
        type: Number, 
        default: 0 
    },
    description: { 
        type: String 
    },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true 
    }
}, 
    { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);