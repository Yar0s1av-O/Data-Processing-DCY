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

class PreferenceService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createPreferenceRecord.bind(this)); // Create a preference record
        this.router.get('/:profile_id', this.getPreferencesByProfileId.bind(this)); // Get all preferences by profile_id
        this.router.delete('/:profile_id/:genre_id', this.deletePreferenceRecordById.bind(this)); // Delete a record by profile_id and genre_id
    }

    // CREATE: Insert a new preference record using stored procedure
    async createPreferenceRecord(req, res) {

        const schema = Joi.object({
            profile_id: Joi.number().required(),
            genre_id: Joi.number().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 400);
        }

        const { profile_id, genre_id } = req.body;

        try {
            await this.db.query(
                'CALL sp_insert_into_preferences($1, $2)',
                [profile_id, genre_id]
            );

            formatResponse(req, res, {
                message: 'Preference record created successfully!',
            }, 201);
        } catch (err) {
            console.error('Error creating preference record:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get all preference records by profile_id
    async getPreferencesByProfileId(req, res) {
        const { profile_id } = req.params;

        if (!profile_id) {
            return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
        }

        try {
            const result = await this.db.query('SELECT * FROM "Preferences" WHERE profile_id = $1', [profile_id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No preference records found for this profile.' }, 404);
            }
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving preferences by profile ID:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve preferences', error: err.message }, 500);
        }
    }

    // DELETE: Delete a preference record by profile_id and genre_id
    async deletePreferenceRecordById(req, res) {
        const { profile_id, genre_id } = req.params;

        if (!profile_id || !genre_id) {
            return formatResponse(req, res, { message: 'Both profile_id and genre_id are required.' }, 400);
        }

        try {
            const deleteQuery = `
                DELETE FROM "Preferences"
                WHERE profile_id = $1 AND genre_id = $2
                RETURNING profile_id, genre_id;
            `;

            const result = await this.db.query(deleteQuery, [profile_id, genre_id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Preference record not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Preference record deleted successfully!' }, 204);
        } catch (err) {
            console.error('Error deleting preference record:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete preference record', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = PreferenceService;
