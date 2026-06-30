const Joi = require('joi');
const { requiredString, id } = require('./common.validator');

const attendanceValidator = {
  mark: Joi.object({
    studentId: id,
    status: requiredString.valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')
  })
};

module.exports = attendanceValidator;