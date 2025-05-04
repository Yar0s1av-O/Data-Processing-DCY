const express = require('express');
const js2xmlparser = require('js2xmlparser');
const Joi = require('joi');

// Utility function
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
        res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
    } else {
        res.status(status).json(data);
    }
}

class WatchlistService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();

        // Validation schemas
        this.watchlistCreateSchema = Joi.object({
            profile_id: Joi.number().integer().required(),
            watchable_id: Joi.number().integer().required()
        });

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createWatchlistRecord.bind(this));
        this.router.get('/:id', this.getWatchlistRecordsByProfileId.bind(this));
        this.router.delete('/:id1/:id2', this.deleteWatchlistRecordById.bind(this));
    }

    // POST /watchlist/create
    async createWatchlistRecord(req, res) {
        const { error } = this.watchlistCreateSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, {
                message: 'Validation failed',
                details: error.details.map(d => d.message)
            }, 422);
        }

        const { profile_id, watchable_id } = req.body;

        try {
            await this.db.query(
                'CALL sp_insert_into_watchlist($1::int, $2::int)',
                [profile_id, watchable_id]
            );

            formatResponse(req, res, {
                message: 'Watchlist record created successfully!'
            }, 201);
        } catch (err) {
            console.error('Error creating watchlist record:', err.stack);
            formatResponse(req, res, {
                message: 'Server error',
                error: err.message
            }, 500);
        }
    }

    // GET /watchlist/:id
    async getWatchlistRecordsByProfileId(req, res) {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return formatResponse(req, res, { message: 'Invalid profile ID.' }, 422);
        }

        try {
            const result = await this.db.query('SELECT * FROM "Watchlist" WHERE profile_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No watchlist records found for this profile.' }, 404);
            }
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watchlist records by profile ID:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve watchlist records', error: err.message }, 500);
        }
    }

    // DELETE /watchlist/:id1/:id2
    async deleteWatchlistRecordById(req, res) {
        const { id1, id2 } = req.params;

        if (!Number.isInteger(Number(id1)) || !Number.isInteger(Number(id2))) {
            return formatResponse(req, res, { message: 'Both profile_id and watchable_id must be integers.' }, 422);
        }

        try {
            const result = await this.db.query(
                'DELETE FROM "Watchlist" WHERE profile_id = $1 AND watchable_id = $2 RETURNING profile_id, watchable_id',
                [id1, id2]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Watchlist record not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Watchlist record deleted successfully!' }, 200);
        } catch (err) {
            console.error('Error deleting watchlist record:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete watchlist record', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WatchlistService;
