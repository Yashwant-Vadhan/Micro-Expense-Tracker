const Source = require('../models/sourceModel');

// Create source (user-specific)
exports.createSource = async (req, res) => {
  try {
    const {name, description} = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });

    const source = await Source.create({ name, description, user_id: req.user._id });
    res.status(201).json(source);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSources = async (req, res) => {
  try {
    const sources = await Source.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSourceById = async (req, res) => {
  try {
    const src = await Source.findById(req.params.id);
    if (!src || src.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Source not found' });
    res.json(src);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSource = async (req, res) => {
  try {
    const src = await Source.findById(req.params.id);
    if (!src || src.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Source not found' });

    src.name = req.body.name ?? src.name;
    src.description = req.body.description ?? src.description;
    await src.save();
    res.json(src);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSource = async (req, res) => {
  try {
    const src = await Source.findById(req.params.id);
    if (!src || src.user_id.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Source not found' });

    await src.deleteOne();
    res.json({ message: 'Source deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
