const express = require('express');
const js2xmlparser = require('js2xmlparser');
const SeriesRepository = require('../repositories/SeriesRepository');

// Utility function to format response based on query parameter
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
        res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
    } else {
        res.status(status).json(data);
    }
}

class SeriesService {
    constructor(db) {
        this.db = db;
        this.seriesRepo = new SeriesRepository(db);
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.getAllSeries.bind(this));
        this.router.get('/:id', this.getSeriesById.bind(this));
        this.router.get('/genre/:genre_name', this.getSeriesByGenreName.bind(this));
        this.router.get('/title/:title', this.getSeriesByTitle.bind(this));
        this.router.get('/title/:title/season/:season', this.getSeriesByTitleAndSeason.bind(this));
        this.router.get('/profile/:profile_id', this.getSeriesByProfilePreferences.bind(this));
    }

    async getAllSeries(req, res) {
        try {
            const result = await this.seriesRepo.getAll();
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving series:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve series', error: err.message }, 500);
        }
    }

    async getSeriesById(req, res) {
        const { id } = req.params;
        if (!id) return formatResponse(req, res, { message: 'Series ID is required.' }, 400);

        try {
            const result = await this.seriesRepo.getById(id);
            if (result.rows.length === 0) return formatResponse(req, res, { message: 'Series not found.' }, 404);
            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error retrieving series by ID:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve series', error: err.message }, 500);
        }
    }

    async getSeriesByGenreName(req, res) {
        const { genre_name } = req.params;
        if (!genre_name) return formatResponse(req, res, { message: 'Genre name is required.' }, 400);

        try {
            const result = await this.seriesRepo.getByGenre(genre_name);
            if (result.rows.length === 0) return formatResponse(req, res, { message: 'No series found for this genre name.' }, 404);
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving series by genre name:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve series by genre name', error: err.message }, 500);
        }
    }

    async getSeriesByTitle(req, res) {
        const { title } = req.params;
        if (!title) return formatResponse(req, res, { message: 'Title is required.' }, 400);

        try {
            const result = await this.seriesRepo.getByTitle(title);
            if (result.rows.length === 0) return formatResponse(req, res, { message: 'No series found with this title.' }, 404);
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving series by title:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve series by title', error: err.message }, 500);
        }
    }

    async getSeriesByTitleAndSeason(req, res) {
        const { title, season } = req.params;
        if (!title || !season) return formatResponse(req, res, { message: 'Title and season are required.' }, 400);

        try {
            const result = await this.seriesRepo.getByTitleAndSeason(title, season);
            if (result.rows.length === 0) return formatResponse(req, res, { message: 'No series found with this title and season.' }, 404);
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving series by title and season:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve series by title and season', error: err.message }, 500);
        }
    }

    async getSeriesByProfilePreferences(req, res) {
        const { profile_id } = req.params;
        if (!profile_id) return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);

        try {
            const result = await this.seriesRepo.getByProfilePreferences(profile_id);
            if (result.rows.length === 0) return formatResponse(req, res, { message: 'No preferred series found for this profile.' }, 404);
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving preferred series:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve preferred series', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = SeriesService;