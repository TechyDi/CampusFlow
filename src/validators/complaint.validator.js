const Joi = require('joi');
const { requiredString, pagination } = require('./common.validator');

const complaintValidator = {
  create: Joi.object({
    title: requiredString,
    description: requiredString,
    category: requiredString
  }),
  updateStatus: Joi.object({
    status: requiredString.valid('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
  }),
  query: pagination.append({
    status: Joi.string().optional()
  })
};

module.exports = complaintValidator;