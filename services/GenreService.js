const express = require('express');
const js2xmlparser = require('js2xmlparser');
const Joi = require("joi");

// Utility function to format response
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
        res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
    } else {
        res.status(status).json(data);
    }
}

class GenreService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createGenre.bind(this)); // Create
        this.router.get('/', this.getAllGenres.bind(this));       // Read all
        this.router.get('/:id', this.getGenreById.bind(this));    // Read one
        this.router.put('/:id', this.updateGenre.bind(this));     // Update
        this.router.delete('/:id', this.deleteGenre.bind(this));  // Delete
    }

    // CREATE: Insert a new genre
    async createGenre(req, res) {
        const schema = Joi.object({
            genre_name: Joi.string().required()
        });

        const { error } = schema.validate(req.body);
        if (error) return formatResponse(req, res, { message: error.details.map(e => e.message) }, 422);

        try {
            const result = await this.db.query(
                'INSERT INTO "Genres" (genre_name) VALUES ($1) RETURNING *',
                [req.body.genre_name]
            );
            formatResponse(req, res, {
                message: 'Genre created successfully!',
                genre: result.rows[0]
            }, 201);
        } catch (err) {
            console.error('Error creating genre:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get all genres
    async getAllGenres(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Genres"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving genres:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve genres', error: err.message }, 500);
        }
    }

    // READ: Get genre by ID
    async getGenreById(req, res) {
        const { id } = req.params;
        try {
            const result = await this.db.query('SELECT * FROM "Genres" WHERE genre_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Genre not found.' }, 404);
            }
            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error retrieving genre:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve genre', error: err.message }, 500);
        }
    }

    // UPDATE: Update genre name by ID
    async updateGenre(req, res) {
        const schema = Joi.object({
            genre_name: Joi.string().required()
        });

        const { error } = schema.validate(req.body);
        if (error) return formatResponse(req, res, { message: error.details.map(e => e.message) }, 422);

        const { id } = req.params;

        try {
            const result = await this.db.query(
                'UPDATE "Genres" SET genre_name = $1 WHERE genre_id = $2 RETURNING *',
                [req.body.genre_name, id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Genre not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Genre updated successfully!',
                genre: result.rows[0]
            }, 200);
        } catch (err) {
            console.error('Error updating genre:', err.stack);
            formatResponse(req, res, { message: 'Failed to update genre', error: err.message }, 500);
        }
    }

    // DELETE: Delete genre by ID
    async deleteGenre(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query(
                'DELETE FROM "Genres" WHERE genre_id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Genre not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Genre deleted successfully!' }, 204);
        } catch (err) {
            console.error('Error deleting genre:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete genre', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = GenreService;
