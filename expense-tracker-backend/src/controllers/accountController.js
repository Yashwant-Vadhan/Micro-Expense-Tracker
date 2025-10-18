// src/controllers/accountController.js
const Account = require('../models/accountModel');

exports.createAccount = async (req, res) => {
  try {
    const { name, balance, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const acc = await Account.create({ name, balance: balance || 0, description, user_id: req.user._id });
    res.status(201).json(acc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accs = await Account.find({ user_id: req.user._id }).sort({ name: 1 });
    res.json(accs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc || acc.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Account not found' });
    res.json(acc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc || acc.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Account not found' });

    acc.name = req.body.name ?? acc.name;
    acc.balance = req.body.balance ?? acc.balance;
    acc.description = req.body.description ?? acc.description;
    await acc.save();
    res.json(acc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc || acc.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Account not found' });

    await acc.remove();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
