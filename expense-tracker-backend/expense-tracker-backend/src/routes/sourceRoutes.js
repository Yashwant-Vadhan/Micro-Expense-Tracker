const express = require('express');
const router = express.Router();
const {
  createSource, getSources, getSourceById, updateSource, deleteSource
} = require('../controllers/sourceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSource);
router.get('/', protect, getSources);
router.get('/:id', protect, getSourceById);
router.put('/:id', protect, updateSource);
router.delete('/:id', protect, deleteSource);

module.exports = router;
