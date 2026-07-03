const LostFoundService = require('../services/lostFound.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const lostFoundValidator = require('../validators/lostFound.validator');
const AppError = require('../utils/AppError');

const createLostItem = asyncHandler(async (req, res, next) => {
    const { error } = lostFoundValidator.reportItem.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const institutionId = req.user.institutionId;
    const studentId = req.user.id;

    const newItem = await LostFoundService.createLostItem(institutionId, studentId, req.body, req.files);
    res.status(201).json(new ApiResponse(201, newItem, 'Item reported successfully'));
});

const resolveLostItem = asyncHandler(async (req, res) => {
    await LostFoundService.resolveLostItem(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse(200, null, 'Item marked as resolved'));
});

module.exports = { createLostItem, resolveLostItem };