const Joi = require('joi');
const { email, phone, requiredString } = require('./common.validator');

const userValidator = {
  updateProfile: Joi.object({
    name: Joi.string().optional(),
    phone: phone.optional(),
    roomNumber: Joi.string().optional()
  })
};

module.exports = userValidator;