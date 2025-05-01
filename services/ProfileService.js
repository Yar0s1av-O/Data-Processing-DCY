const express = require('express');
const js2xmlparser = require('js2xmlparser');
const Joi = require('joi'); // Joi for validation

// Utility function to format response based on query parameter
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
        res.status(status).set('Content-Type', 'application/xml').send(js2xmlparser.parse('response', data));
    } else {
        res.status(status).json(data);
    }
}

class ProfileService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.profileCreateSchema = Joi.object({
            userid: Joi.number().required(),
            profile_name: Joi.string().min(2).max(100).required(),
            profile_photo_link: Joi.string().uri().max(300).required(),
            age: Joi.number().integer().min(0).required(),
            language: Joi.string().max(50).required(),
        });
        this.profileUpdateSchema = Joi.object({
            profile_photo_link: Joi.string().uri().max(300).optional(),
            age: Joi.number().integer().min(0).optional(),
            language: Joi.string().max(50).optional(),
            name: Joi.string().max(100).optional(),
        });
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/create', this.createProfile.bind(this));
        this.router.get('/', this.getAllProfiles.bind(this));
        this.router.get('/:id', this.getProfileById.bind(this));
        this.router.put('/:id', this.updateProfile.bind(this));
        this.router.delete('/:id', this.deleteProfile.bind(this));
    }

    async createProfile(req, res) {
        const { error } = this.profileCreateSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
        }

        const { userid, profile_name, profile_photo_link, age, language } = req.body;

        try {
            await this.db.query(
                'CALL sp_insert_into_profiles($1, $2, $3, $4, $5)',
                [userid, profile_name, profile_photo_link, age, language]
            );

            formatResponse(req, res, { message: 'Profile created successfully!' }, 201);
        } catch (err) {
            console.error('Error during profile creation:', err.stack);
            formatResponse(req, res, { message: 'Internal server error', error: err.message }, 500);
        }
    }

    async getAllProfiles(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Profiles"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving profiles:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve profiles', error: err.message }, 500);
        }
    }

    async getProfileById(req, res) {
        const { id } = req.params;

        if (!id) {
            return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
        }

        try {
            const result = await this.db.query('SELECT * FROM "Profiles" WHERE profile_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Profile not found.' }, 404);
            }
            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error retrieving profile:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve profile', error: err.message }, 500);
        }
    }

    async updateProfile(req, res) {
        const { id } = req.params;

        const { error } = this.profileUpdateSchema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: 'Validation failed', details: error.details }, 422);
        }

        const { profile_photo_link, age, language, name } = req.body;

        if (!id) {
            return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
        }

        try {
            const updateQuery = `
                UPDATE "Profiles"
                SET profile_photo_link = COALESCE($1, profile_photo_link),
                    age = COALESCE($2, age),
                    language = COALESCE($3, language),
                    profile_name = COALESCE($4, profile_name)
                WHERE profile_id = $5
                RETURNING profile_id, profile_photo_link, age, language, profile_name`;

            const result = await this.db.query(updateQuery, [
                profile_photo_link,
                age,
                language,
                name,
                id,
            ]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Profile not found.' }, 404);
            }

            formatResponse(req, res, {
                message: 'Profile updated successfully!',
                profile: result.rows[0],
            }, 200);
        } catch (err) {
            console.error('Error updating profile:', err.stack);
            formatResponse(req, res, { message: 'Failed to update profile', error: err.message }, 500);
        }
    }

    async deleteProfile(req, res) {
        const { id } = req.params;

        if (!id) {
            return formatResponse(req, res, { message: 'Profile ID is required.' }, 400);
        }

        try {
            const result = await this.db.query(
                'DELETE FROM "Profiles" WHERE profile_id = $1 RETURNING profile_id',
                [id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Profile not found.' }, 404);
            }

            res.status(204).send();
        } catch (err) {
            console.error('Error deleting profile:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete profile', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = ProfileService;