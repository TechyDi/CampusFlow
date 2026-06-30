const express = require('express');
const router = express.Router();
const { authenticateToken, checkSubscription } = require('../../middleware/authMiddleware');
const { createListing, markAsSold, buyItem, editListing, deleteListing, messageSeller } = require('../../controllers/marketController');
const upload = require('../../middleware/upload');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/api/marketplace', authenticateToken, checkSubscription('PRO'), upload.array('images', 5), createListing);
router.put('/api/marketplace/:id', authenticateToken, checkSubscription('PRO'), upload.array('images', 5), editListing);
router.delete('/api/marketplace/:id', authenticateToken, checkSubscription('PRO'), deleteListing);
router.post('/api/marketplace/:id/buy', authenticateToken, checkSubscription('PRO'), buyItem);
router.post('/api/marketplace/:id/message', authenticateToken, checkSubscription('PRO'), messageSeller);
router.put('/api/marketplace/:id/sold', authenticateToken, checkSubscription('PRO'), markAsSold);
router.post('/api/market/messages/read', authenticateToken, checkSubscription('PRO'), async (req, res) => {
    try {
        await prisma.message.updateMany({
            where: { receiverId: req.user.id, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to read messages' });
    }
});

module.exports = router;