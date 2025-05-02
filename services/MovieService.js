const express = require('express');
const js2xmlparser = require('js2xmlparser');

// Utility function to format response based on query parameter
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
        res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
    } else {
        res.status(status).json(data);
    }
}

class MovieService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.getAllMovies.bind(this));
        this.router.get('/:id', this.getMovieById.bind(this));
        this.router.get('/genre/:genre_id', this.getMoviesByGenreId.bind(this));
        this.router.get('/title/:title', this.getMoviesByTitle.bind(this)); // New
        this.router.get('/title/:title/genre/:genre_id', this.getMoviesByTitleAndGenre.bind(this)); // New
    }

    // READ: Get all movies from the view
    async getAllMovies(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "movies"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving movies:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve movies', error: err.message }, 500);
        }
    }

    // READ: Get movie by ID
    async getMovieById(req, res) {
        const { id } = req.params;

        if (!id) {
            return formatResponse(req, res, { message: 'Movie ID is required.' }, 400);
        }

        try {
            const result = await this.db.query('SELECT * FROM "movies" WHERE watchable_id = $1', [id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Movie not found.' }, 404);
            }

            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error retrieving movie:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve movie', error: err.message }, 500);
        }
    }

    // READ: Get movies by genre_id
    async getMoviesByGenreId(req, res) {
        const { genre_id } = req.params;

        if (!genre_id) {
            return formatResponse(req, res, { message: 'Genre ID is required.' }, 400);
        }

        try {
            const result = await this.db.query('SELECT * FROM "movies" WHERE genre_id = $1', [genre_id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No movies found for this genre.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving movies by genre:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve movies by genre', error: err.message }, 500);
        }
    }

    // NEW: Get movies by title
    async getMoviesByTitle(req, res) {
        const { title } = req.params;

        if (!title) {
            return formatResponse(req, res, { message: 'Title is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'SELECT * FROM "movies" WHERE LOWER(title) = LOWER($1)',
                [title]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No movies found with this title.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving movies by title:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve movies by title', error: err.message }, 500);
        }
    }

// NEW: Get movies by title and genre
    async getMoviesByTitleAndGenre(req, res) {
        const { title, genre_id } = req.params;

        if (!title || !genre_id) {
            return formatResponse(req, res, { message: 'Title and genre_id are required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'SELECT * FROM "movies" WHERE LOWER(title) = LOWER($1) AND genre_id = $2',
                [title, genre_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No movies found with this title and genre.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving movies by title and genre:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve movies by title and genre', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = MovieService;
