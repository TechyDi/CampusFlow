const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { createCourse, startSession, stopSession, getAttendanceSheet } = require('../../controllers/facultyController');

router.post('/api/faculty/courses', authenticateToken, checkRole(['FACULTY']), createCourse);
router.post('/api/faculty/sessions', authenticateToken, checkRole(['FACULTY']), startSession);
router.put('/api/faculty/sessions/:id/stop', authenticateToken, checkRole(['FACULTY']), stopSession);
router.get('/api/faculty/sessions/:id/attendance', authenticateToken, checkRole(['FACULTY']), getAttendanceSheet);

module.exports = router;