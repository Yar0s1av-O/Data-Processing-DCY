const Joi = require('joi');

// Validation Schema for Watch History Entry
const watchHistorySchema = Joi.object({
  user_id: Joi.number().integer().required(),
  content_id: Joi.number().integer().required(),
  content_title: Joi.string().max(255).required(),
  content_type: Joi.string().valid('Movie', 'TV Show', 'Documentary', 'Series').required(),
  genre: Joi.string().max(50).optional(),
  progress: Joi.number().min(0).max(100).precision(2).optional(),
  duration_watched: Joi.number().integer().min(0).optional(),
  rating: Joi.number().min(0).max(10).precision(1).optional(),
  platform: Joi.string().max(50).optional(),
  is_favorite: Joi.boolean().optional(),
  started_at: Joi.date().iso().optional(),
  ended_at: Joi.date().iso().optional()
});

// Middleware for watch history validation
exports.validateWatchHistory = (req, res, next) => {
  const { error } = watchHistorySchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      message: 'Invalid watch history data',
      error: error.details[0].message
    });
  }
  
  next();
};