const express = require('express');
const { formatResponse } = require('../utils/formatResponse');
const WatchlistRepository = require('../repositories/WatchlistRepository');
const {
  validateWatchlistCreate,
  validateWatchlistParams
} = require('../validators/WatchlistValidator');

class WatchlistService {
  constructor(db) {
    this.db = db;
    this.router = express.Router();
    this.repo = new WatchlistRepository(db);
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/create', this.createWatchlistRecord.bind(this));
    this.router.get('/:id', this.getWatchlistRecordsByProfileId.bind(this));
    this.router.delete('/:id1/:id2', this.deleteWatchlistRecordById.bind(this));
  }

  async createWatchlistRecord(req, res) {
    const { error } = validateWatchlistCreate(req.body);
    if (error) {
      return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
    }

    const { profile_id, watchable_id } = req.body;

    try {
      await this.repo.createWatchlist(profile_id, watchable_id);
      return formatResponse(req, res, { message: 'Watchlist record created successfully!' }, 201);
    } catch (err) {
      console.error('Error creating watchlist record:', err.stack);
      return formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async getWatchlistRecordsByProfileId(req, res) {
    const profile_id = parseInt(req.params.id, 10);
    if (isNaN(profile_id)) {
      return formatResponse(req, res, { message: 'Invalid profile ID.' }, 422);
    }

    try {
      const records = await this.repo.getByProfileId(profile_id);
      if (records.length === 0) {
        return formatResponse(req, res, { message: 'No watchlist records found for this profile.' }, 404);
      }
      return formatResponse(req, res, records, 200);
    } catch (err) {
      console.error('Error retrieving watchlist records by profile ID:', err.stack);
      return formatResponse(req, res, { message: 'Failed to retrieve watchlist records', error: err.message }, 500);
    }
  }

  async deleteWatchlistRecordById(req, res) {
    const profile_id = parseInt(req.params.id1, 10);
    const watchable_id = parseInt(req.params.id2, 10);

    const { error } = validateWatchlistParams(profile_id, watchable_id);
    if (error) {
      return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
    }

    try {
      const deleted = await this.repo.deleteByCompositeId(profile_id, watchable_id);
      if (!deleted) {
        return formatResponse(req, res, { message: 'Watchlist record not found.' }, 404);
      }
      return formatResponse(req, res, { message: 'Watchlist record deleted successfully!' }, 200);
    } catch (err) {
      console.error('Error deleting watchlist record:', err.stack);
      return formatResponse(req, res, { message: 'Failed to delete watchlist record', error: err.message }, 500);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = WatchlistService;
