const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const { createComplaint, deleteComplaint } = require('../../controllers/complaintController');

router.post('/api/complaints', authenticateToken, createComplaint);
router.delete('/api/complaints/:id', authenticateToken, deleteComplaint);

module.exports = router;