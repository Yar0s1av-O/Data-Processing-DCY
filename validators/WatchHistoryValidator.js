const Joi = require('joi');

const validateWatchHistoryCreate = (data) => {
    const schema = Joi.object({
        profile_id: Joi.number().integer().required(),
        watchable_id: Joi.number().integer().required(),
        time_stopped: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required(), // HH:MM:SS format
    });
    return schema.validate(data);
};

const validateWatchHistoryUpdate = (data) => {
    const schema = Joi.object({
        time_stopped: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required(), // HH:MM:SS format
    });
    return schema.validate(data);
};

module.exports = {
    validateWatchHistoryCreate,
    validateWatchHistoryUpdate,
};