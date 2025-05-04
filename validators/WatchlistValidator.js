const Joi = require('joi');

const validateWatchlistCreate = (data) => {
  const schema = Joi.object({
    profile_id: Joi.number().integer().required(),
    watchable_id: Joi.number().integer().required()
  });
  return schema.validate(data);
};

const validateWatchlistParams = (id1, id2) => {
  const schema = Joi.object({
    profile_id: Joi.number().integer().required(),
    watchable_id: Joi.number().integer().required()
  });

  return schema.validate({ profile_id: id1, watchable_id: id2 });
};

module.exports = {
  validateWatchlistCreate,
  validateWatchlistParams
};