const express = require('express');
const router = express.Router();
const { authenticateToken, checkSubscription } = require('../../middleware/authMiddleware');
const { createLostItem, resolveLostItem } = require('../../controllers/lostFoundController');
const upload = require('../../middleware/upload');

router.post('/api/lost-found', authenticateToken, checkSubscription('PRO'), upload.array('images', 5), createLostItem);
router.put('/api/lost-found/:id/resolve', authenticateToken, checkSubscription('PRO'), resolveLostItem);

module.exports = router;