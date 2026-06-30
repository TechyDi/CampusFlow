const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const markNotificationRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        if (notification.userId !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { markNotificationRead };
