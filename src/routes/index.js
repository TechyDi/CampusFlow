const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { authenticateToken, checkUserContext } = require('../middleware/authMiddleware');
const { loginUser, logoutUser } = require('../controllers/authController');
const { createComplaint, deleteComplaint } = require('../controllers/complaintController');
const { createLostItem, resolveLostItem } = require('../controllers/lostFoundController');
const { joinQueue, leaveQueue } = require('../controllers/queueController');
const { createListing, markAsSold, buyItem, editListing, deleteListing, messageSeller } = require('../controllers/marketController');
const { getAttendancePage, checkIn } = require('../controllers/attendanceController');
const upload = require('../middleware/upload');

// --- API ROUTES ---
router.post('/api/login', loginUser);
router.get('/logout', logoutUser);
router.post('/api/complaints', authenticateToken, createComplaint);
router.delete('/api/complaints/:id', authenticateToken, deleteComplaint);
router.post('/api/lost-found', authenticateToken, upload.array('images', 5), createLostItem);
router.put('/api/lost-found/:id/resolve', authenticateToken, resolveLostItem);
router.post('/api/queues/:id/join', authenticateToken, joinQueue);
router.post('/api/queues/:id/leave', authenticateToken, leaveQueue);
router.post('/api/marketplace', authenticateToken, upload.array('images', 5), createListing);
router.put('/api/marketplace/:id', authenticateToken, upload.array('images', 5), editListing);
router.delete('/api/marketplace/:id', authenticateToken, deleteListing);
router.post('/api/marketplace/:id/buy', authenticateToken, buyItem);
router.post('/api/marketplace/:id/message', authenticateToken, messageSeller);
router.put('/api/marketplace/:id/sold', authenticateToken, markAsSold);

router.post('/api/attendance/checkin', authenticateToken, checkIn);

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

router.get('/lost-and-found', authenticateToken, async (req, res) => {
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

router.get('/queues', authenticateToken, async (req, res) => {
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

router.get('/marketplace', authenticateToken, async (req, res) => {
    try {
        const institutionId = req.user.institutionId;

        const items = await prisma.marketItem.findMany({
            where: { institutionId },
            include: { seller: true },
            orderBy: { datePosted: 'desc' }
        });

        res.render('marketplace', { 
            title: 'Campus Marketplace',
            items,
            currentUserId: req.user.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/attendance', authenticateToken, getAttendancePage);

module.exports = router;
