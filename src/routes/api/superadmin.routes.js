const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { createInstitution, deleteInstitution, updateInstitutionPlan } = require('../../controllers/superAdminController');

router.post('/api/superadmin/institutions', authenticateToken, checkRole(['SUPER_ADMIN']), createInstitution);
router.put('/api/superadmin/institutions/:id/plan', authenticateToken, checkRole(['SUPER_ADMIN']), updateInstitutionPlan);
router.delete('/api/superadmin/institutions/:id', authenticateToken, checkRole(['SUPER_ADMIN']), deleteInstitution);

module.exports = router;