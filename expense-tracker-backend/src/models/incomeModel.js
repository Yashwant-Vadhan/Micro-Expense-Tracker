const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    amount: { 
        type: Number, 
        required: true 
    },
    description: { 
        type: String 
    },
    date: { 
        type: Date, 
        required: true 
    },
    source_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Source', 
        required: true 
    },
    account_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true }
  }, 
  { timestamps: true }
);

module.exports = mongoose.model('Income', incomeSchema);
