const express = require('express');
const js2xmlparser = require('js2xmlparser');
const Joi = require("joi");


// Utility function to format response based on query parameter
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
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createWatchlistRecord.bind(this)); // Create a record
        this.router.get('/:id', this.getWatchlistRecordsByProfileId.bind(this)); // Get all records by profile_id
        this.router.delete('/:id1/:id2', this.deleteWatchlistRecordById.bind(this)); // Delete a record by profile_id and watchable_id
    }

    // CREATE: Insert a new watchlist record using stored procedure
    async createWatchlistRecord(req, res) {
        const schema = Joi.object({
            profile_id: Joi.number().required(),
            watchable_id: Joi.number().required(),
        });

        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const messages = error.details.map(err => err.message);
            return formatResponse(req, res, { message: messages }, 422);
        }

        const { profile_id, watchable_id } = req.body;

        if (!profile_id || !watchable_id) {
            return formatResponse(req, res, { message: 'Missing required fields.' }, 400);
        }

        try {
            await this.db.query(
                'CALL sp_insert_into_watchlist($1, $2)',
                [profile_id, watchable_id]
            );

            formatResponse(req, res, {
                message: 'Watchlist record created successfully!',
            }, 201);
        } catch (err) {
            console.error('Error creating watchlist record:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }


    // READ: Get all watchlist records by profile_id
    async getWatchlistRecordsByProfileId(req, res) {
        const { id } = req.params;

        if (!id) {
            return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
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

    // DELETE: Delete a watchlist record by profile_id and watchable_id
    async deleteWatchlistRecordById(req, res) {
        const { id1, id2 } = req.params;

        if (!id1 || !id2) {
            return formatResponse(req, res, { message: 'Both profile_id and watchable_id are required.' }, 400);
        }

        try {
            const deleteQuery = `
                DELETE FROM "Watchlist"
                WHERE profile_id = $1 AND watchable_id = $2
                RETURNING profile_id, watchable_id;
            `;

            const result = await this.db.query(deleteQuery, [id1, id2]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Watchlist record not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Watchlist record deleted successfully!' }, 204);
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
