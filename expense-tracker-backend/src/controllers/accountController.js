const Account = require('../models/accountModel');

exports.createAccount = async (req, res) => {
  try {
    const { bank_name, account_type, holder_name, balance, description } = req.body;

    if (!bank_name || !account_type || !holder_name) {
      return res.status(400).json({ message: 'bank_name, account_type, and holder_name are required' });
    }

    const acc = await Account.create({
      bank_name,
      account_type,
      holder_name,
      balance: balance || 0,
      description,
      user_id: req.user._id
    });

    res.status(201).json(acc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accs = await Account.find({ user_id: req.user._id }).sort({ bank_name: 1 });
    res.json(accs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc || acc.user_id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(acc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const acc = await Account.findById(req.params.id);
    if (!acc || acc.user_id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Account not found' });
    }

    acc.bank_name = req.body.bank_name ?? acc.bank_name;
    acc.account_type = req.body.account_type ?? acc.account_type;
    acc.holder_name = req.body.holder_name ?? acc.holder_name;
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
    if (!acc || acc.user_id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await acc.deleteOne();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

