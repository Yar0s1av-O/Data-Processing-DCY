const express = require('express');
const js2xmlparser = require('js2xmlparser');
const { validateWatchableCreate, validateWatchableUpdate } = require('../validators/WatchableValidator');
const WatchableRepository = require('../repositories/WatchableRepository');

function formatResponse(req, res, data, status = 200) {
  const format = req.query.format;
  if (format === 'xml') {
    res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
  } else {
    res.status(status).json(data);
  }
}

class WatchableService {
  constructor(db) {
    this.db = db;
    this.router = express.Router();
    this.repo = new WatchableRepository(db);
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/create', this.createWatchable.bind(this));
    this.router.get('/', this.getAllWatchables.bind(this));
    this.router.get('/:id', this.getWatchableById.bind(this));
    this.router.put('/:id', this.updateWatchable.bind(this));
    this.router.delete('/:id', this.deleteWatchable.bind(this));
    this.router.get('/preferences/:profile_id', this.getWatchablesByProfilePreferences.bind(this));
    this.router.get('/title/:title', this.getWatchablesByTitle.bind(this));
    this.router.get('/genre/:genre_name', this.getWatchablesByGenreName.bind(this));
  }

  async createWatchable(req, res) {
    const { error } = validateWatchableCreate(req.body);
    if (error) return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);

    const { title, description, genre_id, duration, season, episode } = req.body;

    try {
      await this.repo.createWatchable(title, description, genre_id, duration, season, episode);
      formatResponse(req, res, { message: 'Watchable created successfully!' }, 201);
    } catch (err) {
      console.error('Error creating watchable:', err.stack);
      formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async getAllWatchables(req, res) {
    try {
      const data = await this.repo.getAllWatchables();
      formatResponse(req, res, data, 200);
    } catch (err) {
      console.error('Error retrieving watchables:', err.stack);
      formatResponse(req, res, { message: 'Failed to retrieve watchables', error: err.message }, 500);
    }
  }

  async getWatchableById(req, res) {
    try {
      const watchable = await this.repo.getWatchableById(req.params.id);
      if (!watchable) return formatResponse(req, res, { message: 'Watchable not found.' }, 404);
      formatResponse(req, res, watchable, 200);
    } catch (err) {
      console.error('Error retrieving watchable:', err.stack);
      formatResponse(req, res, { message: 'Failed to retrieve watchable', error: err.message }, 500);
    }
  }

  async getWatchablesByTitle(req, res) {
    try {
      const result = await this.repo.getWatchablesByTitle(req.params.title);
      if (!result.length) return formatResponse(req, res, { message: 'No watchables found with this title.' }, 404);
      formatResponse(req, res, result, 200);
    } catch (err) {
      console.error('Error retrieving watchables by title:', err.stack);
      formatResponse(req, res, { message: 'Failed to retrieve watchables by title', error: err.message }, 500);
    }
  }

  async getWatchablesByGenreName(req, res) {
    try {
      const result = await this.repo.getWatchablesByGenreName(req.params.genre_name);
      if (!result.length) return formatResponse(req, res, { message: 'No watchables found for this genre.' }, 404);
      formatResponse(req, res, result, 200);
    } catch (err) {
      console.error('Error retrieving watchables by genre:', err.stack);
      formatResponse(req, res, { message: 'Failed to retrieve watchables by genre', error: err.message }, 500);
    }
  }

  async getWatchablesByProfilePreferences(req, res) {
    try {
      const result = await this.repo.getWatchablesByProfilePreferences(req.params.profile_id);
      if (!result.length) return formatResponse(req, res, { message: 'No watchables found for the given profile preferences.' }, 404);
      formatResponse(req, res, result, 200);
    } catch (err) {
      console.error('Error retrieving by preferences:', err.stack);
      formatResponse(req, res, { message: 'Failed to retrieve watchables', error: err.message }, 500);
    }
  }

  async updateWatchable(req, res) {
    const { error } = validateWatchableUpdate(req.body);
    if (error) return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);

    try {
      const result = await this.repo.updateWatchable(req.params.id, req.body);
      if (!result) return formatResponse(req, res, { message: 'Watchable not found.' }, 404);
      formatResponse(req, res, { message: 'Watchable updated successfully!', watchable: result }, 200);
    } catch (err) {
      console.error('Error updating watchable:', err.stack);
      formatResponse(req, res, { message: 'Failed to update watchable', error: err.message }, 500);
    }
  }

  async deleteWatchable(req, res) {
    try {
      const result = await this.repo.deleteWatchable(req.params.id);
      if (!result) return formatResponse(req, res, { message: 'Watchable not found.' }, 404);
      res.status(204).send();
    } catch (err) {
      console.error('Error deleting watchable:', err.stack);
      formatResponse(req, res, { message: 'Failed to delete watchable', error: err.message }, 500);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = WatchableService;