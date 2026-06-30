const Joi = require('joi');

const commonValidations = {
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits'
  }),
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid ID format'
  }),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    size: Joi.number().integer().min(1).max(100).default(10)
  }),
  date: Joi.date().iso().messages({
    'date.format': 'Date must be in ISO format'
  }),
  requiredString: Joi.string().trim().min(1).required()
};

module.exports = commonValidations;