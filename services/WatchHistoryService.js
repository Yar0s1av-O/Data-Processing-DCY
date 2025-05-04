const express = require('express');
const { validateWatchHistoryCreate, validateWatchHistoryUpdate } = require('../validators/WatchHistoryValidator');
const WatchHistoryRepository = require('../repositories/WatchHistoryRepository');
const { formatResponse } = require('../utils/formatResponse');

class WatchHistoryService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.repository = new WatchHistoryRepository(db);

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
        const { error } = validateWatchHistoryCreate(req.body);
        if (error) {
            return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
        }

        const { profile_id, watchable_id, time_stopped } = req.body;

        try {
            await this.repository.createWatchHistory(profile_id, watchable_id, time_stopped);
            formatResponse(req, res, { message: 'Watch history record created successfully!' }, 201);
        } catch (err) {
            console.error('Error creating watch history record:', err.stack);
            formatResponse(req, res, { message: 'Internal server error', error: err.message }, 500);
        }
    }

    async getAllWatchHistoryRecords(req, res) {
        try {
            const records = await this.repository.getAllWatchHistory();
            formatResponse(req, res, records, 200);
        } catch (err) {
            console.error('Error retrieving watch history:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve watch history records', error: err.message }, 500);
        }
    }

    async getWatchHistoryRecordById(req, res) {
        const { id } = req.params;
        try {
            const record = await this.repository.getWatchHistoryByProfileId(id);
            if (!record) {
                return formatResponse(req, res, { message: 'Watch history record not found.' }, 404);
            }
            formatResponse(req, res, record, 200);
        } catch (err) {
            console.error('Error retrieving watch history record:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve watch history record', error: err.message }, 500);
        }
    }

    async updateWatchHistoryRecordById(req, res) {
        const { id1, id2 } = req.params;
        const { error } = validateWatchHistoryUpdate(req.body);
        if (error) {
            return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
        }

        const { time_stopped } = req.body;

        try {
            const updated = await this.repository.updateWatchHistory(id1, id2, time_stopped);
            if (!updated) {
                return formatResponse(req, res, { message: 'Watch history record not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Time stopped updated successfully!',
                watchHistory: updated,
            }, 200);
        } catch (err) {
            console.error('Error updating watch history record:', err.stack);
            formatResponse(req, res, { message: 'Failed to update watch history', error: err.message }, 500);
        }
    }

    async deleteWatchHistoryRecordById(req, res) {
        const { id1, id2 } = req.params;
        try {
            const deleted = await this.repository.deleteWatchHistory(id1, id2);
            if (!deleted) {
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
