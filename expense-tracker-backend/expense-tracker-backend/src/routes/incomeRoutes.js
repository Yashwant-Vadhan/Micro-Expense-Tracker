const express = require('express');
const router = express.Router();
const {
  createIncome, getIncomes, getIncomeById, updateIncome, deleteIncome
} = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createIncome);
router.get('/', protect, getIncomes);
router.get('/:id', protect, getIncomeById);
router.put('/:id', protect, updateIncome);
router.delete('/:id', protect, deleteIncome);

module.exports = router;
