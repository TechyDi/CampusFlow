const express = require('express');
const router = express.Router();
const { authenticateToken, checkUserContext, checkRole } = require('../../middleware/authMiddleware');

const { getSuperAdminDashboard } = require('../../controllers/superAdminController');
const { getAdminDashboard } = require('../../controllers/adminController');
const { getWardenDashboard } = require('../../controllers/wardenController');
const { getStaffDashboard } = require('../../controllers/staffController');
const { getFacultyDashboard } = require('../../controllers/facultyController');

router.get('/', checkUserContext, (req, res) => res.render('index', { title: 'CampusFlow - Home' }));
router.get('/superadmin', authenticateToken, checkRole(['SUPER_ADMIN']), getSuperAdminDashboard);
router.get('/superadmin/new', authenticateToken, checkRole(['SUPER_ADMIN']), (req, res) => res.render('superadmin_new'));
router.get('/admin', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getAdminDashboard);
router.get('/warden', authenticateToken, checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getWardenDashboard);
router.get('/staff', authenticateToken, checkRole(['STAFF', 'ADMIN', 'SUPER_ADMIN']), getStaffDashboard);
router.get('/faculty', authenticateToken, checkRole(['FACULTY', 'SUPER_ADMIN']), getFacultyDashboard);

module.exports = router;