const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const { markNotificationRead } = require('../../controllers/notificationController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/api/notifications/:id/read', authenticateToken, markNotificationRead);

router.post('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

module.exports = router;