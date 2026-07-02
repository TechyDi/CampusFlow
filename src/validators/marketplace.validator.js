const Joi = require('joi');
const { requiredString } = require('./common.validator');

const marketplaceValidator = {
  listing: Joi.object({
    title: requiredString,
    description: requiredString,
    price: Joi.number().min(0).required(),
    condition: requiredString,
    contactInfo: requiredString
  }),
  message: Joi.object({
    message: requiredString
  })
};

module.exports = marketplaceValidator;