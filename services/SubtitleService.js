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

class SubtitleService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createSubtitle.bind(this)); // Create
        this.router.get('/:watchable_id', this.getSubtitlesByWatchableId.bind(this)); // Retrieve
        this.router.put('/:watchable_id/:language_id', this.updateSubtitleLink.bind(this)); // Update
        this.router.delete('/:watchable_id/:language_id', this.deleteSubtitle.bind(this)); // Delete
    }

    // CREATE: Insert a new subtitle record
    async createSubtitle(req, res) {

        const schema = Joi.object({
            language_id: Joi.number().required(),
            watchable_id: Joi.number().required(),
            link: Joi.string().required()
        });

        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const messages = error.details.map(err => err.message);
            return formatResponse(req, res, { message: messages }, 422);
        }

        const { language_id, watchable_id, link } = req.body;

        try {
            await this.db.query(
                'INSERT INTO "Subtitles" (language_id, watchable_id, link) VALUES ($1, $2, $3)',
                [language_id, watchable_id, link]
            );

            formatResponse(req, res, {
                message: 'Subtitle record created successfully!',
            }, 201);
        } catch (err) {
            console.error('Error creating subtitle record:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get subtitles by watchable_id
    async getSubtitlesByWatchableId(req, res) {
        const { watchable_id } = req.params;

        if (!watchable_id) {
            return formatResponse(req, res, { message: 'Watchable ID is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'SELECT * FROM "Subtitles" WHERE watchable_id = $1',
                [watchable_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No subtitles found for this watchable.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving subtitles:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve subtitles', error: err.message }, 500);
        }
    }

    // UPDATE: Update subtitle link by watchable_id and language_id
    async updateSubtitleLink(req, res) {
        const schema = Joi.object({
            link: Joi.string().required()
        });

        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const messages = error.details.map(err => err.message);
            return formatResponse(req, res, { message: messages }, 422);
        }

        const { watchable_id, language_id } = req.params;
        const { link } = req.body;

        if (!watchable_id || !language_id) {
            return formatResponse(req, res, { message: 'watchable_id, language_id are required.' }, 400);
        }

        try {
            const result = await this.db.query(
                `UPDATE "Subtitles"
                 SET link = $1
                 WHERE watchable_id = $2 AND language_id = $3
                 RETURNING language_id, watchable_id, link`,
                [link, watchable_id, language_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Subtitle not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Subtitle link updated successfully!',
                subtitle: result.rows[0]
            }, 200);
        } catch (err) {
            console.error('Error updating subtitle link:', err.stack);
            formatResponse(req, res, { message: 'Failed to update subtitle', error: err.message }, 500);
        }
    }

    // DELETE: Delete subtitle by watchable_id and language_id
    async deleteSubtitle(req, res) {
        const { watchable_id, language_id } = req.params;

        if (!watchable_id || !language_id) {
            return formatResponse(req, res, { message: 'Both watchable_id and language_id are required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'DELETE FROM "Subtitles" WHERE watchable_id = $1 AND language_id = $2 RETURNING *',
                [watchable_id, language_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Subtitle not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Subtitle deleted successfully!' }, 204);
        } catch (err) {
            console.error('Error deleting subtitle:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete subtitle', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = SubtitleService;
