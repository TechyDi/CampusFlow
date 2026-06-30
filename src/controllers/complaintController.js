const ComplaintService = require('../services/complaint.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const complaintValidator = require('../validators/complaint.validator');
const AppError = require('../utils/AppError');

const createComplaint = asyncHandler(async (req, res, next) => {
    const { error } = complaintValidator.create.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const { title, buildingId, room, description } = req.body;
    const institutionId = req.user.institutionId;
    const studentId = req.user.id;

    const newComplaint = await ComplaintService.createComplaint(institutionId, studentId, title, buildingId, room, description);

    res.status(201).json(new ApiResponse(201, {
        id: newComplaint.id.substring(0, 8),
        title: newComplaint.title,
        category: newComplaint.category.name,
        building: newComplaint.building.name,
        roomNumber: newComplaint.roomNumber,
        status: newComplaint.status,
        createdAt: newComplaint.createdAt,
        aiCategorized: true
    }, 'Complaint created successfully'));
});

const deleteComplaint = asyncHandler(async (req, res) => {
    const complaintId = req.params.id;
    const studentId = req.user.id;

    await ComplaintService.deleteComplaint(complaintId, studentId);

    res.status(200).json(new ApiResponse(200, null, 'Complaint withdrawn successfully'));
});

module.exports = { createComplaint, deleteComplaint };