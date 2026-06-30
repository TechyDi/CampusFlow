const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { approveUser, createUser, deleteUser, createBuilding, deleteBuilding, createAnnouncement, deleteAnnouncement, createQueue, toggleQueue, deleteQueue } = require('../../controllers/adminController');

router.post('/api/admin/users/:id/approve', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), approveUser);
router.post('/api/admin/users', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createUser);
router.delete('/api/admin/users/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteUser);
router.post('/api/admin/buildings', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createBuilding);
router.delete('/api/admin/buildings/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteBuilding);
router.post('/api/admin/announcements', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createAnnouncement);
router.delete('/api/admin/announcements/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteAnnouncement);

router.post('/api/admin/queues', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createQueue);
router.put('/api/admin/queues/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), toggleQueue);
router.delete('/api/admin/queues/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteQueue);

module.exports = router;