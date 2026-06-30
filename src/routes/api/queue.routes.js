const express = require('express');
const router = express.Router();
const { authenticateToken, checkSubscription } = require('../../middleware/authMiddleware');
const { joinQueue, leaveQueue } = require('../../controllers/queueController');

router.post('/api/queues/join', authenticateToken, checkSubscription('ENTERPRISE'), joinQueue);
router.put('/api/queues/tickets/:id/leave', authenticateToken, checkSubscription('ENTERPRISE'), leaveQueue);

module.exports = router;