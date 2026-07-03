const Joi = require('joi');
const { requiredString } = require('./common.validator');

const lostFoundValidator = {
  reportItem: Joi.object({
    type: requiredString.valid('LOST', 'FOUND'),
    itemName: requiredString,
    description: requiredString,
    location: requiredString
  })
};

module.exports = lostFoundValidator;