const Joi = require('joi');
const { requiredString } = require('./common.validator');

const marketplaceValidator = {
  createItem: Joi.object({
    title: requiredString,
    description: requiredString,
    price: Joi.number().min(0).required(),
    condition: requiredString
  })
};

module.exports = marketplaceValidator;