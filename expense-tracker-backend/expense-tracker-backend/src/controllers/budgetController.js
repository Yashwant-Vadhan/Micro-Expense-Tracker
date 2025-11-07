const Budget = require('../models/budgetModel');

exports.createBudget = async (req, res) => {
  try {
    const { amount, description, start_date, end_date } = req.body;
    if (!amount || !start_date || !end_date) return res.status(400).json({ message: 'amount, start_date, end_date required' });

    const bud = await Budget.create({
      amount, description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      user_id: req.user._id
    });
    res.status(201).json(bud);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBudgets = async (req, res) => {
  try {
    const buds = await Budget.find({ user_id: req.user._id }).sort({ start_date: -1 });
    res.json(buds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBudgetById = async (req, res) => {
  try {
    const bud = await Budget.findById(req.params.id);
    if (!bud || bud.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Budget not found' });
    res.json(bud);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const bud = await Budget.findById(req.params.id);
    if (!bud || bud.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Budget not found' });

    bud.amount = req.body.amount ?? bud.amount;
    bud.description = req.body.description ?? bud.description;
    bud.start_date = req.body.start_date ? new Date(req.body.start_date) : bud.start_date;
    bud.end_date = req.body.end_date ? new Date(req.body.end_date) : bud.end_date;
    await bud.save();
    res.json(bud);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const bud = await Budget.findById(req.params.id);
    if (!bud || bud.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Budget not found' });

    await bud.remove();
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
