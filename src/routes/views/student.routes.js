const express = require('express');
const router = express.Router();
const { authenticateToken, checkUserContext, checkSubscription } = require('../../middleware/authMiddleware');
const { getAttendancePage } = require('../../controllers/attendanceController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ComplaintService = require('../../services/complaint.service');

router.get('/onboarding', (req, res) => res.render('onboarding'));
router.get('/upgrade-required', (req, res) => res.render('upgrade-required'));
router.get('/attendance', authenticateToken, getAttendancePage);

router.get('/complaints', authenticateToken, async (req, res, next) => {
    try {
        if (req.user.role === 'SUPER_ADMIN') return res.redirect('/superadmin');
        if (req.user.role === 'ADMIN') return res.redirect('/admin');

        const { categories, buildings, complaints } = await ComplaintService.getStudentComplaintsData(req.user.institutionId, req.user.id);

        res.render('complaints', { title: 'My Complaints', categories, buildings, complaints });
    } catch (error) {
        next(error);
    }
});

router.get('/announcements', checkUserContext, async (req, res) => {
    try {
        let institutionId = req.user ? req.user.institutionId : (await prisma.institution.findFirst())?.id;
        let announcements = institutionId ? await prisma.announcement.findMany({ where: { institutionId }, orderBy: { datePosted: 'desc' } }) : [];
        res.render('announcements', { title: 'Campus Announcements', announcements });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/lost-and-found', authenticateToken, checkSubscription('PRO'), async (req, res) => {
    try {
        const items = await prisma.lostItem.findMany({ where: { institutionId: req.user.institutionId }, include: { student: true }, orderBy: { dateReported: 'desc' } });
        res.render('lostfound', { title: 'Lost & Found', items, currentUserId: req.user.id });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/queues', authenticateToken, checkSubscription('ENTERPRISE'), async (req, res) => {
    try {
        const queues = await prisma.serviceQueue.findMany({
            where: { institutionId: req.user.institutionId },
            include: { tickets: { where: { status: 'WAITING' }, orderBy: { joinedAt: 'asc' } } }
        });
        const mappedQueues = queues.map(q => {
            const studentTicketIndex = q.tickets.findIndex(t => t.studentId === req.user.id);
            const myTicket = studentTicketIndex !== -1 ? q.tickets[studentTicketIndex] : null;
            return {
                id: q.id, name: q.name, isOpen: q.isOpen, totalWaiting: q.tickets.length,
                myTicket: myTicket ? { id: myTicket.id, position: studentTicketIndex + 1 } : null
            };
        });
        res.render('queues', { title: 'Virtual Queues', queues: mappedQueues });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.get('/marketplace', authenticateToken, checkSubscription('PRO'), async (req, res) => {
    try {
        const items = await prisma.marketItem.findMany({ where: { institutionId: req.user.institutionId }, include: { seller: true }, orderBy: { datePosted: 'desc' } });
        const messages = await prisma.message.findMany({ where: { receiverId: req.user.id }, include: { sender: true }, orderBy: { createdAt: 'desc' } });
        const unreadMessageCount = messages.filter(m => !m.isRead).length;
        res.render('marketplace', { title: 'Campus Marketplace', items, messages, unreadMessageCount, currentUserId: req.user.id });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;