const express = require('express');
const router = express.Router();

// --- API ROUTES ---
router.use('/', require('./api/auth.routes'));
router.use('/', require('./api/superadmin.routes'));
router.use('/', require('./api/onboarding.routes'));
router.use('/', require('./api/complaint.routes'));
router.use('/', require('./api/lostFound.routes'));
router.use('/', require('./api/queue.routes'));
router.use('/', require('./api/notification.routes'));
router.use('/', require('./api/admin.routes'));
router.use('/', require('./api/warden.routes'));
router.use('/', require('./api/staff.routes'));
router.use('/', require('./api/attendance.routes'));
router.use('/', require('./api/marketplace.routes'));
router.use('/', require('./api/faculty.routes'));

// --- VIEW ROUTES ---
router.use('/', require('./views/auth.routes'));
router.use('/', require('./views/dashboard.routes'));
router.use('/', require('./views/student.routes'));

module.exports = router;