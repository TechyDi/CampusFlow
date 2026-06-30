const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { authenticateToken, checkUserContext, checkRole, checkSubscription } = require('../middleware/authMiddleware');
const { loginUser, logoutUser, getSignupPage, registerUser } = require('../controllers/authController');
const { createComplaint, deleteComplaint } = require('../controllers/complaintController');
const { createLostItem, resolveLostItem } = require('../controllers/lostFoundController');
const { joinQueue, leaveQueue } = require('../controllers/queueController');
const { createListing, markAsSold, buyItem, editListing, deleteListing, messageSeller } = require('../controllers/marketController');
const { getAttendancePage, checkIn } = require('../controllers/attendanceController');
const { 
    getFacultyDashboard, 
    createCourse, 
    startSession, 
    stopSession, 
    getAttendanceSheet 
} = require('../controllers/facultyController');

const { getAdminDashboard, approveUser, createUser, deleteUser, createBuilding, deleteBuilding, createAnnouncement, deleteAnnouncement, createQueue, toggleQueue, deleteQueue } = require('../controllers/adminController');
const { getWardenDashboard, assignComplaint, addRemark } = require('../controllers/wardenController');
const { getStaffDashboard, updateTaskStatus } = require('../controllers/staffController');
const { getSuperAdminDashboard, createInstitution, deleteInstitution, updateInstitutionPlan } = require('../controllers/superAdminController');
const { markNotificationRead } = require('../controllers/notificationController');
const upload = require('../middleware/upload');

// --- API ROUTES ---
router.post('/api/login', loginUser);
router.get('/logout', logoutUser);
router.get('/superadmin', authenticateToken, checkRole(['SUPER_ADMIN']), getSuperAdminDashboard);
router.get('/superadmin/new', authenticateToken, checkRole(['SUPER_ADMIN']), (req, res) => res.render('superadmin_new'));
router.post('/api/superadmin/institutions', authenticateToken, checkRole(['SUPER_ADMIN']), createInstitution);
router.put('/api/superadmin/institutions/:id/plan', authenticateToken, checkRole(['SUPER_ADMIN']), updateInstitutionPlan);
router.delete('/api/superadmin/institutions/:id', authenticateToken, checkRole(['SUPER_ADMIN']), deleteInstitution);
router.get('/signup', getSignupPage);
router.post('/api/signup', registerUser);

router.get('/onboarding', (req, res) => {
    res.render('onboarding');
});

const { registerInstitution } = require('../controllers/onboardingController');
router.post('/api/onboarding/register-institution', registerInstitution);
router.post('/api/complaints', authenticateToken, createComplaint);
router.delete('/api/complaints/:id', authenticateToken, deleteComplaint);
router.post('/api/lost-found', authenticateToken, checkSubscription('PRO'), upload.array('images', 5), createLostItem);
router.put('/api/lost-found/:id/resolve', authenticateToken, checkSubscription('PRO'), resolveLostItem);
router.post('/api/queues/join', authenticateToken, checkSubscription('ENTERPRISE'), joinQueue);
router.put('/api/queues/tickets/:id/leave', authenticateToken, checkSubscription('ENTERPRISE'), leaveQueue);
router.post('/api/notifications/:id/read', authenticateToken, markNotificationRead);

// Role-based Dashboards
router.get('/admin', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getAdminDashboard);
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

router.get('/warden', authenticateToken, checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getWardenDashboard);
router.post('/api/warden/complaints/:id/assign', authenticateToken, checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), assignComplaint);
router.post('/api/warden/complaints/:id/remark', authenticateToken, checkRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), addRemark);

router.get('/staff', authenticateToken, checkRole(['STAFF', 'ADMIN', 'SUPER_ADMIN']), getStaffDashboard);
router.put('/api/staff/complaints/:id/status', authenticateToken, checkRole(['STAFF', 'WARDEN', 'ADMIN', 'SUPER_ADMIN']), updateTaskStatus);

router.post('/api/attendance/checkin', authenticateToken, checkIn);
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

router.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to read notification' });
    }
});

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

router.post('/api/attendance/checkin', authenticateToken, checkIn);

// Faculty Routes
router.get('/faculty', authenticateToken, checkRole(['FACULTY', 'SUPER_ADMIN']), getFacultyDashboard);
router.post('/api/faculty/courses', authenticateToken, checkRole(['FACULTY']), createCourse);
router.post('/api/faculty/sessions', authenticateToken, checkRole(['FACULTY']), startSession);
router.put('/api/faculty/sessions/:id/stop', authenticateToken, checkRole(['FACULTY']), stopSession);
router.get('/api/faculty/sessions/:id/attendance', authenticateToken, checkRole(['FACULTY']), getAttendanceSheet);

router.get('/upgrade-required', (req, res) => {
    res.render('upgrade-required');
});

// --- VIEW ROUTES ---
router.get('/', checkUserContext, (req, res) => {
    res.render('index', { title: 'CampusFlow - Home' });
});

router.get('/login', (req, res) => {
    // If already logged in, redirect
    if (req.cookies.token) return res.redirect('/complaints');
    res.render('login', { title: 'Sign In' });
});

router.get('/logout', logoutUser);

router.get('/complaints', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'SUPER_ADMIN') {
            return res.redirect('/superadmin');
        } else if (req.user.role === 'ADMIN') {
            return res.redirect('/admin');
        }

        const institutionId = req.user.institutionId;
        const studentId = req.user.id;

        const categories = await prisma.category.findMany({ where: { institutionId } });
        const buildings = await prisma.building.findMany({ where: { institutionId } });
        
        const complaints = await prisma.complaint.findMany({
            where: { institutionId, studentId },
            include: { category: true, building: true },
            orderBy: { createdAt: 'desc' }
        });

        const mappedComplaints = complaints.map(c => ({
            id: c.id.substring(0, 8),
            fullId: c.id,
            title: c.title,
            category: c.category.name,
            building: c.building.name,
            roomNumber: c.roomNumber,
            status: c.status,
            createdAt: c.createdAt
        }));

        res.render('complaints', { 
            title: 'My Complaints', 
            categories, 
            buildings, 
            complaints: mappedComplaints 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/announcements', checkUserContext, async (req, res) => {
    try {
        // Fallback to first institution if not logged in
        let institutionId;
        if (req.user) {
            institutionId = req.user.institutionId;
        } else {
            const defaultInst = await prisma.institution.findFirst();
            if (defaultInst) institutionId = defaultInst.id;
        }

        let announcements = [];
        if (institutionId) {
            announcements = await prisma.announcement.findMany({
                where: { institutionId },
                orderBy: { datePosted: 'desc' }
            });
        }

        res.render('announcements', { 
            title: 'Campus Announcements',
            announcements
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/lost-and-found', authenticateToken, checkSubscription('PRO'), async (req, res) => {
    try {
        const institutionId = req.user.institutionId;

        const items = await prisma.lostItem.findMany({
            where: { institutionId },
            include: { student: true },
            orderBy: { dateReported: 'desc' }
        });

        res.render('lostfound', { 
            title: 'Lost & Found',
            items,
            currentUserId: req.user.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/queues', authenticateToken, checkSubscription('ENTERPRISE'), async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        const studentId = req.user.id;

        // Fetch all queues for this institution
        const queues = await prisma.serviceQueue.findMany({
            where: { institutionId },
            include: {
                tickets: {
                    where: { status: 'WAITING' },
                    orderBy: { joinedAt: 'asc' }
                }
            }
        });

        // Map queues to include position info
        const mappedQueues = queues.map(q => {
            const studentTicketIndex = q.tickets.findIndex(t => t.studentId === studentId);
            const myTicket = studentTicketIndex !== -1 ? q.tickets[studentTicketIndex] : null;
            
            return {
                id: q.id,
                name: q.name,
                isOpen: q.isOpen,
                totalWaiting: q.tickets.length,
                myTicket: myTicket ? {
                    id: myTicket.id,
                    position: studentTicketIndex + 1
                } : null
            };
        });

        res.render('queues', {
            title: 'Virtual Queues',
            queues: mappedQueues
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/marketplace', authenticateToken, checkSubscription('PRO'), async (req, res) => {
    try {
        const institutionId = req.user.institutionId;

        const items = await prisma.marketItem.findMany({
            where: { institutionId },
            include: { seller: true },
            orderBy: { datePosted: 'desc' }
        });

        const messages = await prisma.message.findMany({
            where: { receiverId: req.user.id },
            include: { sender: true },
            orderBy: { createdAt: 'desc' }
        });

        const unreadMessageCount = messages.filter(m => !m.isRead).length;

        res.render('marketplace', { 
            title: 'Campus Marketplace',
            items,
            messages,
            unreadMessageCount,
            currentUserId: req.user.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/attendance', authenticateToken, getAttendancePage);

module.exports = router;
