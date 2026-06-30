const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getWardenDashboard = async (req, res) => {
    try {
        const institutionId = req.user.institutionId;

        const complaints = await prisma.complaint.findMany({
            where: { 
                institutionId, 
                masterComplaintId: null,
                student: { role: { in: ['STUDENT', 'STAFF'] } }
            },
            include: { student: true, building: true, category: true, assignedStaff: true, subComplaints: true },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch staff members to assign tasks
        const staffMembers = await prisma.user.findMany({
            where: { institutionId, role: 'STAFF' },
            select: { 
                id: true, 
                name: true, 
                email: true,
                assignedTasks: {
                    where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }
                }
            }
        });

        res.render('warden', { complaints, staffMembers, user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const assignComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { staffId } = req.body;

        const complaint = await prisma.complaint.update({
            where: { id },
            data: { 
                assignedStaffId: staffId,
                status: 'ASSIGNED'
            }
        });

        // Notify Student
        await prisma.notification.create({
            data: {
                userId: complaint.studentId,
                title: 'Complaint Assigned',
                message: `Your complaint "${complaint.title}" has been assigned to a staff member.`,
                link: '/complaints'
            }
        });

        // Notify Staff
        await prisma.notification.create({
            data: {
                userId: staffId,
                title: 'New Task Assigned',
                message: `You have been assigned to resolve: "${complaint.title}".`,
                link: '/staff'
            }
        });

        res.json({ success: true, message: 'Staff assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const addRemark = async (req, res) => {
    try {
        const { id } = req.params;
        const { remark } = req.body;
        
        await prisma.complaint.update({
            where: { id },
            data: { wardenRemark: remark }
        });
        
        res.json({ success: true, message: 'Remark added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { getWardenDashboard, assignComplaint, addRemark };
