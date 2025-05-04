// validators/SubscriptionValidator.js
const Joi = require("joi");

const validateCreateSubscription = (data) =>
  Joi.object({
    subscription_type_id: Joi.number().required(),
    subscription_name: Joi.string().required(),
    subscription_price_euro: Joi.number().required(),
  }).validate(data, { abortEarly: false });

const validateUpdateSubscription = (data) =>
  Joi.object({
    subscription_name: Joi.string().required(),
    subscription_price_euro: Joi.number().required(),
  }).validate(data, { abortEarly: false });

const validatePaySubscription = (data) =>
  Joi.object({
    userid: Joi.number().required(),
    subscription_type_id: Joi.number().required(),
  }).validate(data, { abortEarly: false });

module.exports = {
  validateCreateSubscription,
  validateUpdateSubscription,
  validatePaySubscription,
};
