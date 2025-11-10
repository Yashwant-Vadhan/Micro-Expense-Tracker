const Income = require('../models/incomeModel');
const Source = require('../models/sourceModel');

exports.createIncome = async (req, res) => {
  try {
    const {amount,description,date,source_id,account_id} = req.body;
    if (!amount || !source_id || !date) return res.status(400).json({ message: 'amount, source_id and date required' });

    // ensure source belongs to user
    const source = await Source.findById(source_id);
    if (!source || source.user_id.toString() !== req.user._id.toString()) return res.status(400).json({ message: 'Invalid source' });

    const inc = await Income.create({
      amount, description, date: new Date(date),
      source_id, account_id: account_id || null, user_id: req.user._id
    });

    res.status(201).json(inc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getIncomes = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filter = { user_id: req.user._id };
    if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }
    const incomes = await Income.find(filter).populate('source_id account_id').sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getIncomeById = async (req, res) => {
  try {
    const inc = await Income.findById(req.params.id).populate('source_id account_id');
    if (!inc || inc.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Income not found' });
    res.json(inc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const inc = await Income.findById(req.params.id);
    if (!inc || inc.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Income not found' });

    // if source_id is updated, check ownership
    if (req.body.source_id) {
      const src = await Source.findById(req.body.source_id);
      if (!src || src.user_id.toString() !== req.user._id.toString()) return res.status(400).json({ message: 'Invalid source' });
      inc.source_id = req.body.source_id;
    }

    inc.amount = req.body.amount ?? inc.amount;
    inc.description = req.body.description ?? inc.description;
    inc.date = req.body.date ? new Date(req.body.date) : inc.date;
    inc.account_id = req.body.account_id ?? inc.account_id;
    await inc.save();
    res.json(inc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const inc = await Income.findById(req.params.id);
    if (!inc || inc.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Income not found' });

    await inc.deleteOne();
    res.json({ message: 'Income deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
