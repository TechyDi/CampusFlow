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

const ComplaintService = require('../services/complaint.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const complaintValidator = require('../validators/complaint.validator');
const AppError = require('../utils/AppError');

const updateTaskStatus = asyncHandler(async (req, res, next) => {
    const { error } = complaintValidator.updateStatus.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const { id } = req.params;
    const { status } = req.body;
    const staffId = req.user.id;
    const userRole = req.user.role;

    await ComplaintService.updateStatus(id, status, staffId, userRole);

    res.status(200).json(new ApiResponse(200, null, 'Status updated'));
});

module.exports = { getStaffDashboard, updateTaskStatus };
