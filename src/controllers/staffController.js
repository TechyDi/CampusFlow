const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendResolutionEmail } = require('../services/emailService');

const getStaffDashboard = async (req, res) => {
    try {
        const staffId = req.user.id;

        const assignedTasks = await prisma.complaint.findMany({
            where: { assignedStaffId: staffId },
            include: { student: true, building: true, category: true },
            orderBy: { createdAt: 'desc' }
        });

        res.render('staff', { tasks: assignedTasks, user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'IN_PROGRESS' or 'RESOLVED'
        const staffId = req.user.id;

        let task;
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'WARDEN') {
            task = await prisma.complaint.findUnique({ where: { id } });
        } else {
            task = await prisma.complaint.findFirst({
                where: { id, assignedStaffId: staffId }
            });
        }

        if (!task) return res.status(403).json({ error: 'Not authorized for this task' });

        const updated = await prisma.complaint.update({
            where: { id: id },
            data: { status },
            include: { student: true, subComplaints: { include: { student: true } } }
        });

        // Send Resolution Email
        if (status === 'RESOLVED') {
            // Notify master complaint author
            await sendResolutionEmail(updated.student.email, updated.student.name, updated.title);
            
            // Notify all sub-complaint authors (duplicates)
            for (const sub of updated.subComplaints) {
                await sendResolutionEmail(sub.student.email, sub.student.name, sub.title);
                await prisma.notification.create({
                    data: {
                        userId: sub.student.id,
                        title: 'Complaint Resolved',
                        message: `Your similar complaint "${sub.title}" has been resolved.`,
                        link: '/complaints'
                    }
                });
                await prisma.complaint.update({ where: { id: sub.id }, data: { status: 'RESOLVED' } });
            }
        }

        // Notify master student
        await prisma.notification.create({
            data: {
                userId: updated.studentId,
                title: `Complaint Status: ${status}`,
                message: `Your complaint "${updated.title}" is now ${status}.`,
                link: '/complaints'
            }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getStaffDashboard, updateTaskStatus };
