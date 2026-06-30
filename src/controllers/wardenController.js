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

const ComplaintService = require('../services/complaint.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const assignComplaint = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { staffId } = req.body;

    await ComplaintService.assignComplaint(id, staffId);

    res.json(new ApiResponse(200, null, 'Staff assigned successfully'));
});

const addRemark = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { remark } = req.body;
    
    await ComplaintService.addRemark(id, remark);
    
    res.json(new ApiResponse(200, null, 'Remark added successfully'));
});

module.exports = { getWardenDashboard, assignComplaint, addRemark };
