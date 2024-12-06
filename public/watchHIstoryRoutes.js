const express = require('express');
const { 
  addWatchHistory, 
  getUserWatchHistory 
} = require('../controllers/watchHistoryController');
const { validateWatchHistory } = require('../middlewares/validation');

const router = express.Router();

// Route to add watch history
router.post('/watch-history', validateWatchHistory, addWatchHistory);

// Route to get user's watch history
router.get('/users/:user_id/watch-history', getUserWatchHistory);

module.exports = router;