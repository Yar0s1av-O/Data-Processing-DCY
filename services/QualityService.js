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

class QualityService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createQuality.bind(this)); // Create a new quality
        this.router.get('/', this.getAllQualities.bind(this)); // Get all qualities
        this.router.put('/:quality_id', this.updateQualityById.bind(this)); // Update a quality by ID
        this.router.delete('/:quality_id', this.deleteQualityById.bind(this)); // Delete quality by ID
    }

    // CREATE: Insert a new quality record
    async createQuality(req, res) {

        const schema = Joi.object({
            name: Joi.string().required()
        });

        const { error} = schema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 422);
        }

        const { name } = req.body;

        try {
            const result = await this.db.query(
                'INSERT INTO "Qualities" (name) VALUES ($1) RETURNING quality_id, name',
                [name]
            );

            formatResponse(req, res, {
                message: 'Quality created successfully!',
                quality: result.rows[0],
            }, 201);
        } catch (err) {
            console.error('Error creating quality:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }



    // READ: Get all quality records
    async getAllQualities(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Qualities" ORDER BY quality_id ASC');

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No qualities found.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving qualities:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve qualities', error: err.message }, 500);
        }
    }

    // UPDATE: Update quality name by quality_id
    async updateQualityById(req, res) {
        const { quality_id } = req.params;
        const { name } = req.body;

        if (!quality_id || !name) {
            return formatResponse(req, res, { message: 'Both quality_id and name are required.' }, 400);
        }

        try {
            const result = await this.db.query(
                `UPDATE "Qualities"
             SET name = $1
             WHERE quality_id = $2
             RETURNING quality_id, name`,
                [name, quality_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Quality not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Quality updated successfully!',
                quality: result.rows[0]
            }, 200);
        } catch (err) {
            console.error('Error updating quality:', err.stack);
            formatResponse(req, res, { message: 'Failed to update quality', error: err.message }, 500);
        }
    }


    // DELETE: Delete a quality record by quality_id
    async deleteQualityById(req, res) {
        const { quality_id } = req.params;

        if (!quality_id) {
            return formatResponse(req, res, { message: 'Quality ID is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'DELETE FROM "Qualities" WHERE quality_id = $1 RETURNING quality_id, name',
                [quality_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Quality not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Quality deleted successfully!' }, 204);
        } catch (err) {
            console.error('Error deleting quality:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete quality', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = QualityService;
