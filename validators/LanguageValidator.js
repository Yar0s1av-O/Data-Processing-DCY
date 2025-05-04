const Joi = require("joi");

const validateCreateLanguage = (data) => {
  return Joi.object({
    name: Joi.string().required(),
  }).validate(data, { abortEarly: false });
};

const validateUpdateLanguage = (data) => {
  return Joi.object({
    name: Joi.string().required(),
  }).validate(data, { abortEarly: false });
};

module.exports = {
  validateCreateLanguage,
  validateUpdateLanguage,
};