const express = require('express');
const { formatResponse } = require('../utils/formatResponse');
const {
  validateGenreCreate,
  validateGenreUpdate,
} = require('../validators/GenreValidator');
const GenreRepository = require('../repositories/GenreRepository');

class GenreService {
  constructor(db) {
    this.db = db;
    this.repo = new GenreRepository(db);
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/create', this.create.bind(this));
    this.router.get('/', this.getAll.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.put('/:id', this.update.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
  }

  async create(req, res) {
    const { error } = validateGenreCreate(req.body);
    if (error) return formatResponse(req, res, { message: error.details }, 422);

    try {
      const genre = await this.repo.create(req.body.genre_name);
      return formatResponse(req, res, { message: 'Genre created!', genre }, 201);
    } catch (err) {
      console.error('Create genre error:', err.stack);
      return formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async getAll(req, res) {
    try {
      const genres = await this.repo.getAll();
      return formatResponse(req, res, genres, 200);
    } catch (err) {
      console.error('Get all genres error:', err.stack);
      return formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async getById(req, res) {
    try {
      const genre = await this.repo.getById(req.params.id);
      if (!genre) return formatResponse(req, res, { message: 'Genre not found.' }, 404);
      return formatResponse(req, res, genre, 200);
    } catch (err) {
      console.error('Get genre by ID error:', err.stack);
      return formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async update(req, res) {
    const { error } = validateGenreUpdate(req.body);
    if (error) return formatResponse(req, res, { message: error.details }, 422);

    try {
      const genre = await this.repo.update(req.params.id, req.body.genre_name);
      if (!genre) return formatResponse(req, res, { message: 'Genre not found.' }, 404);
      return formatResponse(req, res, { message: 'Genre updated!', genre }, 200);
    } catch (err) {
      console.error('Update genre error:', err.stack);
      return formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  async delete(req, res) {
    try {
      const deleted = await this.repo.delete(req.params.id);
      if (!deleted) return formatResponse(req, res, { message: 'Genre not found.' }, 404);
      return formatResponse(req, res, { message: 'Genre deleted successfully!' }, 204);
    } catch (err) {
      console.error('Delete genre error:', err.stack);
      return formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = GenreService;
