const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSuperAdminDashboard = async (req, res) => {
    try {
        // Fetch all institutions and count of their users
        const institutions = await prisma.institution.findMany({
            include: {
                _count: {
                    select: { users: true, buildings: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalUsers = await prisma.user.count();
        const totalComplaints = await prisma.complaint.count();

        res.render('superadmin', {
            title: 'Super Admin Dashboard',
            institutions,
            stats: { totalUsers, totalComplaints }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

const createInstitution = async (req, res) => {
    const { name, subdomain, subscriptionPlan } = req.body;
    try {
        if (!name || !subdomain) {
            return res.status(400).json({ error: 'Name and Subdomain are required' });
        }
        await prisma.institution.create({
            data: { name, subdomain, subscriptionPlan: subscriptionPlan || 'FREE' }
        });
        res.redirect('/superadmin');
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to create institution (Subdomain might exist already)");
    }
};

const updateInstitutionPlan = async (req, res) => {
    const { id } = req.params;
    const { subscriptionPlan } = req.body;
    try {
        await prisma.institution.update({
            where: { id },
            data: { subscriptionPlan }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update institution plan' });
    }
};

const deleteInstitution = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.$transaction(async (tx) => {
            // Find users to delete related records that only map to User
            const users = await tx.user.findMany({ where: { institutionId: id }, select: { id: true } });
            const userIds = users.map(u => u.id);

            // Delete User-bound relations
            await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
            await tx.message.deleteMany({
                where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] }
            });
            await tx.attendanceRecord.deleteMany({ where: { studentId: { in: userIds } } });
            await tx.queueTicket.deleteMany({ where: { studentId: { in: userIds } } });
            
            // Delete Institution-bound relations
            await tx.complaintLog.deleteMany({ where: { complaint: { institutionId: id } } });
            await tx.complaint.updateMany({ where: { institutionId: id }, data: { masterComplaintId: null } }); // Break self-relations if any
            await tx.complaint.deleteMany({ where: { institutionId: id } });
            await tx.lostItem.deleteMany({ where: { institutionId: id } });
            await tx.marketItem.deleteMany({ where: { institutionId: id } });
            
            // Delete Attendance sessions before courses
            await tx.attendanceSession.deleteMany({ where: { course: { institutionId: id } } });
            await tx.course.deleteMany({ where: { institutionId: id } });
            
            await tx.serviceQueue.deleteMany({ where: { institutionId: id } });
            await tx.category.deleteMany({ where: { institutionId: id } });
            await tx.building.deleteMany({ where: { institutionId: id } });
            await tx.announcement.deleteMany({ where: { institutionId: id } });
            
            // Finally delete users and institution
            await tx.user.deleteMany({ where: { institutionId: id } });
            await tx.institution.delete({ where: { id } });
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete institution' });
    }
};

module.exports = {
    getSuperAdminDashboard,
    createInstitution,
    updateInstitutionPlan,
    deleteInstitution
};
