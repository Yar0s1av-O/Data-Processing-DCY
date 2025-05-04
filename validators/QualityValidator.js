const Joi = require("joi");

const validateCreateQuality = (data) =>
  Joi.object({
    name: Joi.string().required(),
  }).validate(data, { abortEarly: false });

const validateUpdateQuality = (data) =>
  Joi.object({
    name: Joi.string().required(),
  }).validate(data, { abortEarly: false });

module.exports = {
  validateCreateQuality,
  validateUpdateQuality,
};