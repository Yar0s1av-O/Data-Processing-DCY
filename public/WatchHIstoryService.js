const express = require('express');

class WatchHistoryService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Define a route to log watch history
        this.router.post('/log', this.logWatchHistory.bind(this));

        // Define a route to fetch watch history
        this.router.get('/:userId', this.getWatchHistory.bind(this));
    }

    // Log watch history
    async logWatchHistory(req, res) {
        const { user_id, content_id, content_title, content_type, progress, duration_watched, platform, started_at, ended_at } = req.body;

        if (!user_id || !content_id) {
            return res.status(400).json({ message: 'user_id and content_id are required!' });
        }

        try {
            const result = await this.db.query(
                `INSERT INTO "WatchHistory" (user_id, content_id, content_title, content_type, progress, duration_watched, platform, started_at, ended_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [user_id, content_id, content_title, content_type, progress, duration_watched, platform, started_at, ended_at]
            );

            res.status(201).json({ message: 'Watch history logged successfully!', id: result.rows[0].id });
        } catch (err) {
            console.error('Error logging watch history:', err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }

    // Get watch history for a specific user
    async getWatchHistory(req, res) {
        const { userId } = req.params;

        try {
            const result = await this.db.query(
                `SELECT * FROM "WatchHistory" WHERE user_id = $1`,
                [userId]
            );

            res.status(200).json(result.rows);
        } catch (err) {
            console.error('Error fetching watch history:', err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WatchHistoryService;
