const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    category_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Category', 
        required: true 
    },
    account_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Account' 
    },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true 
    }
},
    { timestamp : true }
);

module.exports = mongoose.model('Expense', expenseSchema);
