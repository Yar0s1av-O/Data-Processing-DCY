const express = require('express');
const js2xmlparser = require("js2xmlparser");

// Utility function to format response based on query parameter
function formatResponse(req, res, data, status = 200) {
    const format = req.query.format;
    if (format === 'xml') {
        res.status(status).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", data));
    } else {
        res.status(status).json(data);
    }
}

class ProfileService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // CREATE: Add a new profile for a user
        this.router.post('/', this.registerProfile.bind(this));

        // READ: Get all profiles
        this.router.get('/', this.getAllProfiles.bind(this));

        // READ: Get a specific profile by ID
        this.router.get('/:id', this.getProfileById.bind(this));

        // UPDATE: Update a profile
        this.router.put('/:id', this.updateProfile.bind(this));

        // DELETE: Delete a profile
        this.router.delete('/:id', this.deleteProfile.bind(this));
    }

    // CREATE: Register a profile
    async registerProfile(req, res) {
        const { email, profile_photo_link, age, language, name } = req.body;

        if (!email || !name) {
            return formatResponse(req, res, { message: 'Email and name are required!' }, 400);
        }

        try {
            // Verify if the user exists
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length === 0) {
                return formatResponse(req, res, { message: 'User with this email not found.' }, 404);
            }

            // Insert the profile into the "Profiles" table
            const newProfile = await this.db.query(
                `INSERT INTO "Profiles" (profile_photo_link, age, language, name)
                 VALUES ($1, $2, $3, $4)
                 RETURNING profile_id, profile_photo_link, age, language, name`,
                [profile_photo_link, age, language, name]
            );

            // Link the user to the new profile in "User profile connection"
            await this.db.query(
                `INSERT INTO "User profile connection" (user_id, profile_id)
                 VALUES ($1, $2)`,
                [userCheck.rows[0].user_id, newProfile.rows[0].profile_id]
            );

            formatResponse(req, res, {
                message: 'Profile created successfully!',
                profile: newProfile.rows[0],
            }, 201);
        } catch (err) {
            console.error('Error during profile registration:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get all profiles
    async getAllProfiles(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Profiles"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error retrieving profiles:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve profiles', error: err.message }, 500);
        }
    }

    // READ: Get a profile by ID
    async getProfileById(req, res) {
        const { id } = req.params;

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

    // UPDATE: Update a profile by ID
    async updateProfile(req, res) {
        const { id } = req.params;
        const { profile_photo_link, age, language, name } = req.body;

        try {
            const updateQuery = `
                UPDATE "Profiles"
                SET profile_photo_link = COALESCE($1, profile_photo_link),
                    age = COALESCE($2, age),
                    language = COALESCE($3, language),
                    name = COALESCE($4, name)
                WHERE profile_id = $5
                RETURNING profile_id, profile_photo_link, age, language, name`;

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

    // DELETE: Delete a profile by ID
    async deleteProfile(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query(
                'DELETE FROM "Profiles" WHERE profile_id = $1 RETURNING profile_id',
                [id]
            );

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Profile not found.' }, 404);
            }

            formatResponse(req, res, { message: 'Profile deleted successfully.' }, 200);
        } catch (err) {
            console.error('Error deleting profile:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete profile', error: err.message }, 500);
        }
    }

    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = ProfileService;
