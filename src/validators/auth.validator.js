const Joi = require('joi');
const { email, password, requiredString } = require('./common.validator');

const authValidator = {
  login: Joi.object({
    email,
    password
  }),
  register: Joi.object({
    name: requiredString,
    email,
    password,
    institutionId: requiredString
  })
};

module.exports = authValidator;