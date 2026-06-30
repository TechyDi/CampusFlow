const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAdminDashboard = async (req, res) => {
    try {
        const institutionId = req.user.institutionId;

        const pendingUsers = await prisma.user.findMany({
            where: { institutionId, isApproved: false }
        });

        const staffUsers = await prisma.user.findMany({
            where: { institutionId, isApproved: true, role: { in: ['ADMIN', 'WARDEN', 'STAFF'] } },
            include: {
                assignedTasks: {
                    where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const studentUsers = await prisma.user.findMany({
            where: { institutionId, isApproved: true, role: 'STUDENT' },
            orderBy: { createdAt: 'desc' }
        });

        const buildings = await prisma.building.findMany({
            where: { institutionId },
            orderBy: { createdAt: 'desc' }
        });

        const adminComplaints = await prisma.complaint.findMany({
            where: { institutionId, student: { role: { in: ['WARDEN', 'FACULTY'] } } },
            include: { student: true, category: true, building: true },
            orderBy: { createdAt: 'desc' }
        });

        // Warden-level complaints (Student & Staff) for "All Complaints" tab
        const wardenComplaints = await prisma.complaint.findMany({
            where: { 
                institutionId, 
                masterComplaintId: null,
                student: { role: { in: ['STUDENT', 'STAFF'] } }
            },
            include: { student: true, building: true, category: true, assignedStaff: true },
            orderBy: { createdAt: 'desc' }
        });

        const announcements = await prisma.announcement.findMany({
            where: { institutionId },
            orderBy: { datePosted: 'desc' }
        });

        // Virtual Queues
        const queues = await prisma.serviceQueue.findMany({
            where: { institutionId },
            include: {
                tickets: { where: { status: 'WAITING' } }
            },
            orderBy: { name: 'asc' }
        });

        // Analytics
        const totalComplaints = await prisma.complaint.count({ where: { institutionId } });
        const resolvedComplaints = await prisma.complaint.count({ where: { institutionId, status: 'RESOLVED' } });
        
        const openComplaints = totalComplaints - resolvedComplaints;
        const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

        res.render('admin', { pendingUsers, staffUsers, studentUsers, buildings, adminComplaints, wardenComplaints, announcements, queues, totalComplaints, openComplaints, resolutionRate, user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const approveUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { action } = req.body; // 'APPROVE' or 'REJECT'

        if (action === 'APPROVE') {
            await prisma.user.update({
                where: { id: userId },
                data: { isApproved: true }
            });
        } else if (action === 'REJECT') {
            await prisma.user.delete({
                where: { id: userId }
            });
        }

        res.json({ success: true, message: `User ${action.toLowerCase()}d successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const institutionId = req.user.institutionId;

        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
                institutionId,
                isApproved: true
            }
        });
        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Don't let admin delete themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }
        await prisma.user.delete({ where: { id: userId } });
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

const createBuilding = async (req, res) => {
    try {
        const { name, type } = req.body;
        const institutionId = req.user.institutionId;

        await prisma.building.create({
            data: {
                name,
                type,
                institutionId
            }
        });
        res.json({ success: true, message: 'Building created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create building' });
    }
};

const deleteBuilding = async (req, res) => {
    try {
        const buildingId = req.params.id;
        await prisma.building.delete({ where: { id: buildingId } });
        res.json({ success: true, message: 'Building deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete building' });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        const institutionId = req.user.institutionId;

        await prisma.announcement.create({
            data: { title, content, type, institutionId }
        });
        res.json({ success: true, message: 'Announcement created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const announcementId = req.params.id;
        await prisma.announcement.delete({ where: { id: announcementId } });
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const createQueue = async (req, res) => {
    try {
        const { name } = req.body;
        const institutionId = req.user.institutionId;

        await prisma.serviceQueue.create({
            data: {
                name,
                institutionId
            }
        });

        res.status(201).json({ success: true, message: 'Queue created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const toggleQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const { isOpen } = req.body;

        await prisma.serviceQueue.update({
            where: { id },
            data: { isOpen }
        });

        res.json({ success: true, message: 'Queue updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const deleteQueue = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.serviceQueue.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Queue deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { 
    getAdminDashboard, 
    approveUser, 
    createUser, 
    deleteUser, 
    createBuilding, 
    deleteBuilding,
    createAnnouncement,
    deleteAnnouncement,
    createQueue,
    toggleQueue,
    deleteQueue
};
