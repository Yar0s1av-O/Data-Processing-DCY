const Joi = require('joi');

const createSchema = Joi.object({
  userid: Joi.number().required(),
  profile_name: Joi.string().min(2).max(100).required(),
  profile_photo_link: Joi.string().uri().max(300).required(),
  age: Joi.number().integer().min(0).required(),
  language_id: Joi.number().required(),
});

const updateSchema = Joi.object({
  profile_photo_link: Joi.string().uri().max(300).optional(),
  age: Joi.number().integer().min(0).optional(),
  language_id: Joi.number().optional(),
  profile_name: Joi.string().min(2).max(100).optional(),
});

function validateProfileCreate(data) {
  return createSchema.validate(data);
}

function validateProfileUpdate(data) {
  return updateSchema.validate(data);
}

module.exports = {
  validateProfileCreate,
  validateProfileUpdate
};