const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');

exports.createExpense = async (req, res) => {
  try {
    const { amount, description, date, category_id, account_id } = req.body;
    if (!amount || !date || !category_id) return res.status(400).json({ message: 'amount, date and category_id required' });

    const cat = await Category.findById(category_id);
    if (!cat || cat.user_id.toString() !== req.user._id.toString()) return res.status(400).json({ message: 'Invalid category' });

    const exp = await Expense.create({
      amount, description, date: new Date(date),
      category_id, account_id: account_id || null, user_id: req.user._id
    });

    res.status(201).json(exp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filter = { user_id: req.user._id };
    if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }
    const expenses = await Expense.find(filter).populate('category_id account_id').sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id).populate('category_id account_id');
    if (!exp || exp.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Expense not found' });
    res.json(exp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp || exp.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Expense not found' });

    if (req.body.category_id) {
      const cat = await Category.findById(req.body.category_id);
      if (!cat || cat.user_id.toString() !== req.user._id.toString()) return res.status(400).json({ message: 'Invalid category' });
      exp.category_id = req.body.category_id;
    }

    exp.amount = req.body.amount ?? exp.amount;
    exp.description = req.body.description ?? exp.description;
    exp.date = req.body.date ? new Date(req.body.date) : exp.date;
    exp.account_id = req.body.account_id ?? exp.account_id;
    await exp.save();
    res.json(exp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const exp = await Expense.findById(req.params.id);
    if (!exp || exp.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Expense not found' });

    await exp.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
