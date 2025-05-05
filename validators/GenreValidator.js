const Joi = require("joi");

const validateGenreCreate = (data) =>
  Joi.object({
    genre_name: Joi.string().required(),
  }).validate(data, { abortEarly: false });

const validateGenreUpdate = (data) =>
  Joi.object({
    genre_name: Joi.string().required(),
  }).validate(data, { abortEarly: false });

module.exports = {
  validateGenreCreate,
  validateGenreUpdate,
};
