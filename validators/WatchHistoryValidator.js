const Joi = require('joi');

const validateWatchHistoryCreate = (data) => {
    const schema = Joi.object({
        profile_id: Joi.number().integer().required(),
        watchable_id: Joi.number().integer().required(),
        time_stopped: Joi.number().min(0).required(),
    });
    return schema.validate(data);
};

const validateWatchHistoryUpdate = (data) => {
    const schema = Joi.object({
        time_stopped: Joi.number().min(0).required(),
    });
    return schema.validate(data);
};

module.exports = {
    validateWatchHistoryCreate,
    validateWatchHistoryUpdate,
};