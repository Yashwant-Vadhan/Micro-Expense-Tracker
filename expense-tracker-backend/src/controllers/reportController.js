// controllers/reportController.js
const Report = require('../models/reportModel');
const Income = require('../models/incomeModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');

// Create / generate report
exports.generateReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date required' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    // Fetch incomes & expenses within date range
    const incomes = await Income.find({
      user_id: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      user_id: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('category_id');

    const total_income = incomes.reduce((sum, i) => sum + i.amount, 0);
    const total_expense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = total_income - total_expense;

    // Compute expense totals per category
    const categoryTotals = {};
    for (const e of expenses) {
      const name = e.category_id?.name || 'Uncategorized';
      categoryTotals[name] = (categoryTotals[name] || 0) + e.amount;
    }

    const top_category = Object.entries(categoryTotals).length
      ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]
      : 'None';

    // Save report
    const report = await Report.create({
      user_id: req.user._id,
      start_date: start,
      end_date: end,
      total_income,
      total_expense,
      balance
    });

    res.status(201).json({
      message: 'Report generated successfully',
      report,
      summary: {
        total_income,
        total_expense,
        balance,
        top_category,
        categoryTotals,
        incomes_count: incomes.length,
        expenses_count: expenses.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Get all reports for user
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ user_id: req.user._id }).sort({ created_at: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report || report.user_id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// OPTIONAL: API for chart data (frontend can use this for Chart.js)
exports.getChartData = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const start = new Date(start_date);
    const end = new Date(end_date);

    const expenses = await Expense.find({
      user_id: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('category_id');

    const catTotals = {};
    for (const e of expenses) {
      const name = e.category_id?.name || 'Uncategorized';
      catTotals[name] = (catTotals[name] || 0) + e.amount;
    }

    const incomes = await Income.find({
      user_id: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const total_income = incomes.reduce((s, i) => s + i.amount, 0);
    const total_expense = Object.values(catTotals).reduce((a, b) => a + b, 0);

    res.json({
      total_income,
      total_expense,
      balance: total_income - total_expense,
      categoryTotals: catTotals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};