// src/controllers/categoryController.js
const Category = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const cat = await Category.create({ name, description, user_id: req.user._id });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find({ user_id: req.user._id }).sort({ name: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat || cat.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat || cat.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Category not found' });

    cat.name = req.body.name ?? cat.name;
    cat.description = req.body.description ?? cat.description;
    await cat.save();
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat || cat.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Category not found' });

    await cat.remove();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
