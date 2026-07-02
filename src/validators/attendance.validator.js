const Joi = require('joi');
const { requiredString, id } = require('./common.validator');

const attendanceValidator = {
  checkIn: Joi.object({
    checkInCode: requiredString,
    lat: Joi.number().optional(),
    lng: Joi.number().optional()
  })
};

module.exports = attendanceValidator;