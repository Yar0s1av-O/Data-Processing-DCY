const Joi = require("joi");

const validateCreatePreference = (data) => {
  return Joi.object({
    profile_id: Joi.number().required(),
    genre_id: Joi.number().required()
  }).validate(data, { abortEarly: false });
};

module.exports = {
  validateCreatePreference
};
