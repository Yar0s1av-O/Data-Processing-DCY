const Joi = require('joi');

function validateLogin(data) {
  return Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }).validate(data);
}

function validateRegistration(data) {
  return Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    subscription_type_id: Joi.number().integer().optional(),
    failed_login_attempts: Joi.number().integer().optional()
  }).validate(data);
}

function validateInvite(data) {
  return Joi.object({
    invited_user_email: Joi.string().email().required(),
    invite_by_user_id: Joi.number().integer().required()
  }).validate(data);
}

function validateUserUpdate(data) {
  return Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    subscription_type_id: Joi.number().integer().optional(),
    failed_login_attempts: Joi.number().integer().optional()
  }).validate(data);
}

module.exports = {
  validateLogin,
  validateRegistration,
  validateInvite,
  validateUserUpdate
};
