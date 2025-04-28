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

class WatchHistoryService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createWatchHistoryRecord.bind(this)); // Create a record
        this.router.get('/', this.getAllWatchHistoryRecords.bind(this)); // Get all records
        this.router.get('/:id', this.getWatchHistoryRecordById.bind(this)); // Get a record by ID
        this.router.put('/:id1/:id2', this.updateWatchHistoryRecordById.bind(this)); // Update a record by profile_id and watchable_id
        this.router.delete('/:id1/:id2', this.deleteWatchHistoryRecordById.bind(this)); // Delete a record by profile_id and watchable_id
    }

    async createWatchHistoryRecord(req, res) {
        const { profile_id, watchable_id, time_stopped} = req.body;

        if (!profile_id || !watchable_id || !time_stopped) {
            return formatResponse(req, res, { message: 'Missing required fields.' }, 400);
        }

        try {
            await this.db.query(
                'CALL sp_insert_into_watch_history($1, $2, $3)',
                [profile_id, watchable_id, time_stopped]
            );

            formatResponse(req, res, {
                message: 'watch history records created successfully!',
            }, 201);
        } catch (err) {
            console.error('Error during watch history records registration:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get all watch history records
    async getAllWatchHistoryRecords(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Watch history"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving watch history records:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve watch history records', error: err.message }, 500);
        }
    }

    // READ: Get a single watch history record by profile_id
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

    // UPDATE: Update the time_stopped for a watch history record by profile_id and watchable_id
    async updateWatchHistoryRecordById(req, res) {
        const { id1, id2 } = req.params;
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
            console.error('Error updating watch history time_stopped:', err.stack);
            formatResponse(req, res, { message: 'Failed to update watch history', error: err.message }, 500);
        }
    }

    // DELETE: Delete a watch history record by profile_id and watchable_id
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

            formatResponse(req, res, { message: 'Watch history record deleted successfully!' }, 204);
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
