const Joi = require('joi');
const { requiredString, date } = require('./common.validator');

const lostFoundValidator = {
  reportItem: Joi.object({
    type: requiredString.valid('LOST', 'FOUND'),
    itemName: requiredString,
    description: requiredString,
    date: date.required(),
    location: requiredString
  })
};

module.exports = lostFoundValidator;