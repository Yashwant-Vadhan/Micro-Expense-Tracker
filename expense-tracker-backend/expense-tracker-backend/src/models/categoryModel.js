const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
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

module.exports = mongoose.model('Category', categorySchema);