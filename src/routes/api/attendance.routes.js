const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const { checkIn } = require('../../controllers/attendanceController');

router.post('/api/attendance/checkin', authenticateToken, checkIn);

module.exports = router;