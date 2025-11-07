const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  bank_name: { type: String, required: true },
  account_type: { type: String, required: true },
  holder_name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  description: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Account', accountSchema);
