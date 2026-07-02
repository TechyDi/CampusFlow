const AttendanceService = require('../services/attendance.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const attendanceValidator = require('../validators/attendance.validator');
const AppError = require('../utils/AppError');

const getAttendancePage = asyncHandler(async (req, res) => {
    const institutionId = req.user.institutionId;
    const studentId = req.user.id;

    const { activeSessions, pastRecords } = await AttendanceService.getAttendancePageData(institutionId, studentId);

    res.render('attendance', {
        title: 'Smart Attendance',
        activeSessions,
        pastRecords,
        studentId
    });
});

const checkIn = asyncHandler(async (req, res, next) => {
    const { error } = attendanceValidator.checkIn.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const { checkInCode, lat, lng } = req.body;
    const studentId = req.user.id;
    const institutionId = req.user.institutionId;

    const courseName = await AttendanceService.checkIn(studentId, institutionId, checkInCode, lat, lng);

    res.status(200).json(new ApiResponse(200, null, `Checked into ${courseName} successfully!`));
});

module.exports = { getAttendancePage, checkIn };