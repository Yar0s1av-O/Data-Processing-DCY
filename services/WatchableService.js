const express = require('express');
const js2xmlparser = require('js2xmlparser');
const Joi = require('joi');

// Utility function to format response based on query parameter
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
        this.watchableCreateSchema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().allow('', null),
            genre_id: Joi.number().required(),
            duration: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required(), // Format: HH:MM:SS
            season: Joi.number().integer().allow(null),
            episode: Joi.number().integer().allow(null)
        });

        this.watchableUpdateSchema = Joi.object({
            title: Joi.string().optional(),
            description: Joi.string().allow('', null).optional(),
            genre_id: Joi.number().optional(),
            duration: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).optional(),
            season: Joi.number().integer().allow(null).optional(),
            episode: Joi.number().integer().allow(null).optional()
        });

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

    // CREATE: Insert a new watchable using stored procedure
    async createWatchable(req, res) {
        const {error} = this.watchableCreateSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, {message: 'Validation failed', details: error.details}, 422);
        }

        const {title, description, genre_id, duration, season, episode} = req.body;

        try {
            await this.db.query(
                'CALL sp_insert_into_watchable($1, $2, $3, $4, $5, $6)',
                [title, description, genre_id, duration, season, episode]
            );

            formatResponse(req, res, {message: 'Watchable created successfully!'}, 201);
        } catch (err) {
            console.error('Error creating watchable:', err.stack);
            formatResponse(req, res, {message: 'Server error', error: err.message}, 500);
        }
    }

    async getAllWatchables(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Watchable"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watchables:', err.stack);
            formatResponse(req, res, {message: 'Failed to retrieve watchables', error: err.message}, 500);
        }
    }

    async getWatchableById(req, res) {
        const {id} = req.params;

        if (!id) {
            return formatResponse(req, res, {message: 'Watchable ID is required.'}, 400);
        }

        try {
            const result = await this.db.query('SELECT * FROM "Watchable" WHERE watchable_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, {message: 'Watchable not found.'}, 404);
            }
            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error retrieving watchable:', err.stack);
            formatResponse(req, res, {message: 'Failed to retrieve watchable', error: err.message}, 500);
        }
    }

    // NEW: Get watchables by title
    async getWatchablesByTitle(req, res) {
        const {title} = req.params;

        if (!title) {
            return formatResponse(req, res, {message: 'Title is required.'}, 400);
        }

        try {
            const result = await this.db.query(
                'SELECT * FROM "Watchable" WHERE title LIKE $1',
                [`%${title}%`]
            );


            if (result.rows.length === 0) {
                return formatResponse(req, res, {message: 'No watchables found with this title.'}, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watchables by title:', err.stack);
            formatResponse(req, res, {message: 'Failed to retrieve watchables by title', error: err.message}, 500);
        }
    }

// NEW: Get watchables by title and genre
    async getWatchablesByGenreName(req, res) {
        const { genre_name } = req.params;

        if (!genre_name) {
            return formatResponse(req, res, { message: 'Genre name is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                `SELECT w.* 
             FROM "Watchable" w
             JOIN "Genres" g ON w.genre_id = g.genre_id
             WHERE g.genre_name ILIKE $1`,
                [`%${genre_name}%`]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No watchables found for this genre.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watchables by genre:', err.stack);
            formatResponse(req, res, {
                message: 'Failed to retrieve watchables by genre',
                error: err.message
            }, 500);
        }
    }


    async updateWatchable(req, res) {
        const {id} = req.params;

        const {error} = this.watchableUpdateSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, {message: 'Validation failed', details: error.details}, 422);
        }

        const {title, description, genre_id, duration, season, episode} = req.body;

        try {
            const updateQuery = `
                UPDATE "Watchable"
                SET 
                    title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    genre_id = COALESCE($3, genre_id),
                    duration = COALESCE($4, duration),
                    season = COALESCE($5, season),
                    episode = COALESCE($6, episode)
                WHERE watchable_id = $7
                RETURNING *`;

            const result = await this.db.query(updateQuery, [
                title,
                description,
                genre_id,
                duration,
                season,
                episode,
                id
            ]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, {message: 'Watchable not found.'}, 404);
            }

            formatResponse(req, res, {
                message: 'Watchable updated successfully!',
                watchable: result.rows[0],
            }, 200);
        } catch (err) {
            console.error('Error updating watchable:', err.stack);
            formatResponse(req, res, {message: 'Failed to update watchable', error: err.message}, 500);
        }
    }

    async getWatchablesByProfilePreferences(req, res) {
        const {profile_id} = req.params;

        if (!profile_id) {
            return formatResponse(req, res, {message: 'Profile ID is required.'}, 400);
        }

        try {
            const query = `
            SELECT w.*
            FROM "Watchable" w
            JOIN "Preferences" p ON w.genre_id = p.genre_id
            WHERE p.profile_id = $1
        `;
            const result = await this.db.query(query, [profile_id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, {message: 'No watchables found for the given profile preferences.'}, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watchables by profile preferences:', err.stack);
            formatResponse(req, res, {message: 'Failed to retrieve watchables', error: err.message}, 500);
        }
    }


    async deleteWatchable(req, res) {
        const {id} = req.params;

        try {
            const result = await this.db.query(
                'DELETE FROM "Watchable" WHERE watchable_id = $1 RETURNING watchable_id',
                [id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, {message: 'Watchable not found.'}, 404);
            }

            res.status(204).send();
        } catch (err) {
            console.error('Error deleting watchable:', err.stack);
            formatResponse(req, res, {message: 'Failed to delete watchable', error: err.message}, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WatchableService;
