const express = require('express');
const bcrypt = require('bcrypt');

class ProfileService {
    constructor(db) {
        this.db = db; // Use the database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Define routes
        this.router.post('/registerProfile', this.registerProfile.bind(this));
    }

    async registerProfile(req, res) {
        const { email, password, profile_photo_link, age, language, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required!' });
        }

        try {
            // Check if the email already exists
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length == 0) {
                return res.status(400).json({ message: 'Email not found' });
            }

            // Insert the profile into the database
            const newProfile = await this.db.query(
                `INSERT INTO "Profiles" (profile_photo_link, age, language, name)
                 VALUES ($1, $2, $3, $4)
                 RETURNING profile_id, profile_photo_link, age, language, name`,
                [profile_photo_link, age, language, name]
            );

            await this.db.query(
                `INSERT INTO "User profile connection" (user_id, profile_id)
                 VALUES (`+userCheck.rows[0].user_id+`, `+newProfile.rows[0].profile_id+`)`
                
            );

            res.status(201).json({
                message: 'Profile has been created',
                profile: { profile_id: newProfile.rows[0].profile_id,profile_photo_link: newProfile.rows[0].profile_photo_link,language: newProfile.rows[0].language, age: newProfile.rows[0].age, name: newProfile.rows[0].name },
            });
        } catch (err) {
            console.error('Error during registration:', err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }

    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = ProfileService;
