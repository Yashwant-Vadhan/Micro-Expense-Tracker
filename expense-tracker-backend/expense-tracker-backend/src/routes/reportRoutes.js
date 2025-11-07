const express = require('express');
const router = express.Router();
const { generateReport, getReports, getReportById } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateReport); // POST /api/reports/generate
router.get('/', protect, getReports);
router.get('/:id', protect, getReportById);

module.exports = router;
