const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    start_date: { 
        type: Date, 
        required: true },
    end_date: { 
        type: Date, 
        required: true },
    total_income: { 
        type: Number, 
        required: true },
    total_expense: { 
        type: Number, 
        required: true },
    balance: { 
        type: Number, 
        required: true },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true }
}, 
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
