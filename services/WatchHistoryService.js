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

class WatchHistoryService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();

        // Validation schemas
        this.createSchema = Joi.object({
            profile_id: Joi.number().integer().required(),
            watchable_id: Joi.number().integer().required(),
            time_stopped: Joi.number().min(0).required(),
        });

        this.updateSchema = Joi.object({
            time_stopped: Joi.number().min(0).required(),
        });

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createWatchHistoryRecord.bind(this));
        this.router.get('/', this.getAllWatchHistoryRecords.bind(this));
        this.router.get('/:id', this.getWatchHistoryRecordById.bind(this));
        this.router.put('/:id1/:id2', this.updateWatchHistoryRecordById.bind(this));
        this.router.delete('/:id1/:id2', this.deleteWatchHistoryRecordById.bind(this));
    }

    async createWatchHistoryRecord(req, res) {
        const { error } = this.createSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
        }

        const { profile_id, watchable_id, time_stopped } = req.body;

        try {
            await this.db.query(
                'CALL sp_insert_into_watch_history($1, $2, $3)',
                [profile_id, watchable_id, time_stopped]
            );

            formatResponse(req, res, {
                message: 'Watch history record created successfully!',
            }, 201);
        } catch (err) {
            console.error('Error during watch history record creation:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    async getAllWatchHistoryRecords(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Watch history"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watch history records:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve watch history records', error: err.message }, 500);
        }
    }

    async getWatchHistoryRecordById(req, res) {
        const { id } = req.params;

        if (!id) {
            return formatResponse(req, res, { message: 'Watch history ID is required.' }, 400);
        }

        try {
            const result = await this.db.query('SELECT * FROM "Watch history" WHERE profile_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Watch history record not found.' }, 404);
            }
            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error retrieving watch history record:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve watch history record', error: err.message }, 500);
        }
    }

    async updateWatchHistoryRecordById(req, res) {
        const { id1, id2 } = req.params;

        const { error } = this.updateSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
        }

        const { time_stopped } = req.body;

        if (!id1 || !id2) {
            return formatResponse(req, res, { message: 'Both profile_id and watchable_id are required.' }, 400);
        }

        try {
            const updateQuery = `
                UPDATE "Watch history"
                SET time_stopped = COALESCE($1, time_stopped)
                WHERE profile_id = $2 AND watchable_id = $3
                RETURNING profile_id, watchable_id, time_stopped;
            `;

            const result = await this.db.query(updateQuery, [time_stopped, id1, id2]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Watch history record not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Time stopped updated successfully!',
                watchHistory: result.rows[0],
            }, 200);
        } catch (err) {
            console.error('Error updating watch history record:', err.stack);
            formatResponse(req, res, { message: 'Failed to update watch history', error: err.message }, 500);
        }
    }

    async deleteWatchHistoryRecordById(req, res) {
        const { id1, id2 } = req.params;

        if (!id1 || !id2) {
            return formatResponse(req, res, { message: 'Both profile_id and watchable_id are required.' }, 400);
        }

        try {
            const deleteQuery = `
                DELETE FROM "Watch history"
                WHERE profile_id = $1 AND watchable_id = $2
                RETURNING profile_id, watchable_id;
            `;

            const result = await this.db.query(deleteQuery, [id1, id2]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Watch history record not found.' }, 404);
            }

            res.status(204).send();
        } catch (err) {
            console.error('Error deleting watch history record:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete watch history record', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WatchHistoryService;
