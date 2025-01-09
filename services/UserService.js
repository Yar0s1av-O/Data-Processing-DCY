
const express = require('express');
const bcrypt = require('bcrypt');
const js2xmlparser = require("js2xmlparser");
const jwt = require('jsonwebtoken');

// Utility function to format response in JSON or XML
function formatResponse(req, res, data, status = 200) {
    const acceptHeader = req.headers.accept;

    if (acceptHeader && acceptHeader.includes("application/xml")) {
        res.status(status).set("Content-Type", "application/xml");
        res.send(js2xmlparser.parse("response", data));
    } else {
        res.status(status).set("Content-Type", "application/json");
        res.json(data);
    }
}

class UserService {
    constructor(db) {
        this.db = db; // Database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // READ: Login an user
        this.router.post('/login', this.loginUser.bind(this));

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

    // READ: Get user by ID
    async loginUser(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return formatResponse(req, res, { message: 'Email and password are required!' }, 400);
        }

        try {

            // Check if user by email already exists
            const result = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Email or password is incorrect.' }, 404);
            }

            // Get hashed password of user found
            const storedHashedPassword = result.rows[0].password;

            // compare user password and exists user password
            const isMatch = await bcrypt.compare(password, storedHashedPassword);
            if (!isMatch) {
                return formatResponse(req, res, { message: 'Email or password is incorrect.' }, 404);
            }

            // Generate JWT token
            const payload = {
                user_id: result.rows[0].user_id,
                email: result.rows[0].email,
            };
            const token = jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' }); // Expiration time 1 hour

            const resultUserProfiles = await this.db.query('SELECT * FROM "UserProfiles" WHERE email = $1', [email]);
            const userProfiles = resultUserProfiles.rows.map(row => ({
                user_id: row.user_id,
                name: row.name,
                family: row.family,
                email: row.email,
                age: row.age,
                profile_photo_link: row.profile_photo_link,
                subscription_type_id: row.subscription_type_id,
                subscription_end_date: row.subscription_end_date,
            }));

            const responseData = {
                message: 'Login successful!',
                token: token,
                user: userProfiles,
            };

            formatResponse(req, res, responseData, 200);
        } catch (err) {
            console.error('Error fetching user:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve user' }, 500);
        }
    }

    // CREATE: Register a new user
    async registerUser(req, res) {
        const { email, password, subscription_type_id = 1, failed_login_attempts = 0 } = req.body;

        if (!email || !password) {
            return formatResponse(req, res, { message: 'Email and password are required!' }, 400);
        }

        try {
            // Check if the user already exists
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length > 0) {
                return formatResponse(req, res, { message: 'Email is already registered!' }, 400);
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

            const responseData = {
                message: 'User registered successfully!',
                user: {
                    id: newUser.rows[0].user_id,
                    email: newUser.rows[0].email
                },
            };

            formatResponse(req, res, responseData, 201);
        } catch (err) {
            console.error('Error during registration:', err.stack);
            formatResponse(req, res, { message: 'Server error', error: err.message }, 500);
        }
    }

    // READ: Get all users
    async getAllUsers(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Users"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error fetching users:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve users' }, 500);
        }
    }

    // READ: Get user by ID
    async getUserById(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query('SELECT * FROM "Users" WHERE user_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'User not found' }, 404);
            }
            formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Error fetching user:', err.stack);
            formatResponse(req, res, { message: 'Failed to retrieve user' }, 500);
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
                return formatResponse(req, res, { message: 'User not found' }, 404);
            }

            formatResponse(req, res, {
                message: 'User updated successfully!',
                user: result.rows[0],
            }, 200);
        } catch (err) {
            console.error('Error updating user:', err.stack);
            formatResponse(req, res, { message: 'Failed to update user' }, 500);
        }
    }

    // DELETE: Delete user by ID
    async deleteUser(req, res) {
        const { id } = req.params;

        try {
            const result = await this.db.query('DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id', [id]);

            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'User not found' }, 404);
            }

            formatResponse(req, res, { message: 'User deleted successfully!' }, 200);
        } catch (err) {
            console.error('Error deleting user:', err.stack);
            formatResponse(req, res, { message: 'Failed to delete user' }, 500);
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
