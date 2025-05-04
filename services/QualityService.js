
const express = require('express');
const js2xmlparser = require('js2xmlparser');
const { validateCreateQuality, validateUpdateQuality } = require('../validators/QualityValidator');
const QualityRepository = require('../repositories/QualityRepository');

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
        this.repo = new QualityRepository(db);
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createQuality.bind(this));
        this.router.get('/', this.getAllQualities.bind(this));
        this.router.put('/:quality_id', this.updateQualityById.bind(this));
        this.router.delete('/:quality_id', this.deleteQualityById.bind(this));
    }

    async createQuality(req, res) {
        const { error } = validateCreateQuality(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 422);
        }

        try {
            const quality = await this.repo.createQuality(req.body.name);
            formatResponse(req, res, { message: 'Quality created successfully!', quality }, 201);
        } catch (err) {
            console.error('Error creating quality:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    async getAllQualities(req, res) {
        try {
            const qualities = await this.repo.getAllQualities();
            if (qualities.length === 0) {
                return formatResponse(req, res, { message: 'No qualities found.' }, 404);
            }
            formatResponse(req, res, qualities, 200);
        } catch (err) {
            console.error('Error retrieving qualities:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve qualities', error: err.message }, 500);
        }
    }

    async updateQualityById(req, res) {
        const { quality_id } = req.params;
        const { error } = validateUpdateQuality(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 422);
        }

        try {
            const quality = await this.repo.updateQuality(quality_id, req.body.name);
            if (!quality) {
                return formatResponse(req, res, { message: 'Quality not found.' }, 404);
            }
            formatResponse(req, res, { message: 'Quality updated successfully!', quality }, 200);
        } catch (err) {
            console.error('Error updating quality:', err.stack);
            formatResponse(req, res, { message: 'Failed to update quality', error: err.message }, 500);
        }
    }

    async deleteQualityById(req, res) {
        const { quality_id } = req.params;
        try {
            const deleted = await this.repo.deleteQuality(quality_id);
            if (!deleted) {
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