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
        this.router.get('/title/:title', this.getMoviesByTitle.bind(this)); // New
        this.router.get('/genre/:genre_name', this.getMoviesByGenreName.bind(this));
        this.router.get('/profile/:profile_id', this.getMoviesByProfilePreferences.bind(this));
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
    async getMoviesByGenreName(req, res) {
        const { genre_name } = req.params;

        if (!genre_name) {
            return formatResponse(req, res, { message: 'Genre name is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                `SELECT m.*
             FROM movies m
             JOIN "Genres" g ON m.genre_id = g.genre_id
             WHERE g.genre_name ILIKE $1`,
                [`%${genre_name}%`]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No movies found for this genre name.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving movies by genre name:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve movies by genre name', error: err.message }, 500);
        }
    }


    // READ: Get movies by profile's preferred genres
    async getMoviesByProfilePreferences(req, res) {
        const { profile_id } = req.params;

        if (!profile_id) {
            return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
        }

        try {
            const query = `
            SELECT m.*
            FROM movies m
            JOIN "Preferences" p ON m.genre_id = p.genre_id
            WHERE p.profile_id = $1
        `;
            const result = await this.db.query(query, [profile_id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No preferred movies found for this profile.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving preferred movies:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve preferred movies', error: err.message }, 500);
        }
    }


    getRouter() {
        return this.router;
    }
}

module.exports = MovieService;
