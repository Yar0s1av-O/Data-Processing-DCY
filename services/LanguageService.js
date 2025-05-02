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

class LanguageService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createLanguage.bind(this)); // Create a language
        this.router.get('/', this.getAllLanguages.bind(this)); // Get all languages
        this.router.put('/:language_id', this.updateLanguageById.bind(this)); // Update language by ID
        this.router.delete('/:language_id', this.deleteLanguageById.bind(this)); // Delete by language_id
    }

    // CREATE: Insert a new language record
    async createLanguage(req, res) {
        const { name } = req.body;

        if (!name) {
            return formatResponse(req, res, { message: 'Name is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'INSERT INTO "Language" (name) VALUES ($1) RETURNING language_id, name',
                [name]
            );

            formatResponse(req, res, {
                message: 'Language created successfully!',
                language: result.rows[0],
            }, 201);
        } catch (err) {
            console.error('Error creating language:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get all language records
    async getAllLanguages(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Language" ORDER BY language_id ASC');

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'No languages found.' }, 404);
            }

            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving languages:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve languages', error: err.message }, 500);
        }
    }

    // UPDATE: Update language name by ID
    async updateLanguageById(req, res) {
        const { language_id } = req.params;
        const { name } = req.body;

        if (!language_id || !name) {
            return formatResponse(req, res, { message: 'Both language_id and name are required.' }, 400);
        }

        try {
            const result = await this.db.query(
                `UPDATE "Language"
                 SET name = $1
                 WHERE language_id = $2
                 RETURNING language_id, name`,
                [name, language_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Language not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Language updated successfully!',
                language: result.rows[0]
            }, 200);
        } catch (err) {
            console.error('Error updating language:', err.stack);
            formatResponse(req, res, { message: 'Failed to update language', error: err.message }, 500);
        }
    }

    // DELETE: Delete language record by language_id
    async deleteLanguageById(req, res) {
        const { language_id } = req.params;

        if (!language_id) {
            return formatResponse(req, res, { message: 'Language ID is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'DELETE FROM "Language" WHERE language_id = $1 RETURNING language_id, name',
                [language_id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Language not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Language deleted successfully!' }, 204);
        } catch (err) {
            console.error('Error deleting language:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete language', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = LanguageService;
