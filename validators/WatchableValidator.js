const Joi = require('joi');

// Schema for creating a watchable
const validateWatchableCreate = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow('', null),
    genre_id: Joi.number().required(),
    duration: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required(), // HH:MM:SS format
    season: Joi.number().integer().allow(null),
    episode: Joi.number().integer().allow(null),
  });

  return schema.validate(data);
};

// Schema for updating a watchable
const validateWatchableUpdate = (data) => {
  const schema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().allow('', null).optional(),
    genre_id: Joi.number().optional(),
    duration: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).optional(),
    season: Joi.number().integer().allow(null).optional(),
    episode: Joi.number().integer().allow(null).optional(),
  });

  return schema.validate(data);
};

module.exports = {
  validateWatchableCreate,
  validateWatchableUpdate,
};