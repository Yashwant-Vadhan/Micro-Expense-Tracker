const Report = require('../models/reportModel');
const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');

exports.generateReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    if (!start_date || !end_date) return res.status(400).json({ message: 'start_date and end_date required' });

    const start = new Date(start_date);
    const end = new Date(end_date);

    const incomes = await Income.find({
      user_id: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      user_id: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('category_id');

    const total_income = incomes.reduce((s, i) => s + i.amount, 0);
    const total_expense = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = total_income - total_expense;

    // top expense category
    const catTotals = {};
    for (const e of expenses) {
      const name = e.category_id?.name || 'Uncategorized';
      catTotals[name] = (catTotals[name] || 0) + e.amount;
    }
    const top_category = Object.keys(catTotals).length
      ? Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    const report = await Report.create({
      start_date: start, end_date: end,
      total_income, total_expense, balance,
      user_id: req.user._id
    });

    res.status(201).json({ report, top_category, incomes_count: incomes.length, expenses_count: expenses.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ user_id: req.user._id }).sort({ start_date: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const rep = await Report.findById(req.params.id);
    if (!rep || rep.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Report not found' });
    res.json(rep);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
