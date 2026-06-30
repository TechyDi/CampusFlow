const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { assignComplaint, addRemark } = require('../../controllers/wardenController');

router.post('/api/warden/complaints/:id/assign', authenticateToken, checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), assignComplaint);
router.post('/api/warden/complaints/:id/remark', authenticateToken, checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), addRemark);

module.exports = router;