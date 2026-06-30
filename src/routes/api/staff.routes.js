const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { updateTaskStatus } = require('../../controllers/staffController');

router.put('/api/staff/complaints/:id/status', authenticateToken, checkRole(['STAFF', 'WARDEN', 'ADMIN', 'SUPER_ADMIN']), updateTaskStatus);

module.exports = router;