
const express = require('express');
const bcrypt = require('bcrypt');

class UserService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // CREATE: Register a new user
        this.router.post('/register', this.registerUser.bind(this));

        // READ: Get all users
        this.router.get('/', this.getAllUsers.bind(this));

        // READ: Get a user by ID
        this.router.get('/:id', this.getUserById.bind(this));

        // UPDATE: Update user by ID
        this.router.put('/:id', this.updateUser.bind(this));

        // DELETE: Delete user by ID
        this.router.delete('/:id', this.deleteUser.bind(this));
    }

    // CREATE: Register a new user
    async registerUser(req, res) {
        const { email, password, subscription_type_id = 1, failed_login_attempts = 0 } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required!' });
        }

        try {
            // Check if the user already exists
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email is already registered!' });
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert new user
            const newUser = await this.db.query(
                `INSERT INTO "Users" (email, password, subscription_type_id, failed_login_attempts)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, email`,
                [email, hashedPassword, subscription_type_id, failed_login_attempts]
            );

            res.status(201).json({
                message: 'User registered successfully!',
                user: { id: newUser.rows[0].user_id, email: newUser.rows[0].email },
            });
        } catch (err) {
            console.error('Error during registration:', err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }

    // READ: Get all users
    async getAllUsers(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Users"');
            res.status(200).json(result.rows);
        } catch (err) {
            console.error('Error fetching users:', err.stack);
            res.status(500).json({ message: 'Failed to retrieve users' });
        }
    }

    // READ: Get user by ID
    async getUserById(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query('SELECT * FROM "Users" WHERE user_id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching user:', err.stack);
            res.status(500).json({ message: 'Failed to retrieve user' });
        }
    }

    // UPDATE: Update user by ID
    async updateUser(req, res) {
        const { id } = req.params;
        const { email, password, subscription_type_id, failed_login_attempts } = req.body;

        try {
            // Hash new password if provided
            let hashedPassword = null;
            if (password) {
                const saltRounds = 10;
                hashedPassword = await bcrypt.hash(password, saltRounds);
            }

            const updateQuery = `
                UPDATE "Users"
                SET email = COALESCE($1, email),
                    password = COALESCE($2, password),
                    subscription_type_id = COALESCE($3, subscription_type_id),
                    failed_login_attempts = COALESCE($4, failed_login_attempts)
                WHERE user_id = $5
                RETURNING user_id, email, subscription_type_id, failed_login_attempts
            `;

            const result = await this.db.query(updateQuery, [
                email,
                hashedPassword,
                subscription_type_id,
                failed_login_attempts,
                id,
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                message: 'User updated successfully!',
                user: result.rows[0],
            });
        } catch (err) {
            console.error('Error updating user:', err.stack);
            res.status(500).json({ message: 'Failed to update user' });
        }
    }

    // DELETE: Delete user by ID
    async deleteUser(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query('DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ message: 'User deleted successfully!' });
        } catch (err) {
            console.error('Error deleting user:', err.stack);
            res.status(500).json({ message: 'Failed to delete user' });
        }
    }

    // CREATE: Add user through OAuth
    async addUserThroughOAuth(profile) {
        const email = profile.emails[0].value;
        const subscription_type_id = 1; // Default subscription
        const failed_login_attempts = 0;

        try {
            // Check if the user exists
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length > 0) {
                return userCheck.rows[0]; // Return existing user
            }

            // Insert new OAuth user
            const newUser = await this.db.query(
                `INSERT INTO "Users" (email, password, subscription_type_id, failed_login_attempts)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, email`,
                [email, 'google_oauth_user', subscription_type_id, failed_login_attempts]
            );

            return newUser.rows[0];
        } catch (err) {
            console.error('Error adding OAuth user:', err.stack);
            throw err;
        }
    }

    getRouter() {
        return this.router; // Return the router for use in main
    }
}

module.exports = UserService;
