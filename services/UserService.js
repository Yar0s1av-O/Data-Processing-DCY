const express = require('express');
const bcrypt = require('bcrypt');
const js2xmlparser = require("js2xmlparser");
const jwt = require('jsonwebtoken');
const Joi = require('joi');

function formatResponse(req, res, data, status = 200) {
    const acceptHeader = req.headers.accept;
    const urlFormat = req.query.format;

    if ((urlFormat && urlFormat.toLowerCase() === 'xml') ||
        (acceptHeader && acceptHeader.includes("application/xml"))) {
        res.status(status).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", data));
    } else {
        res.status(status).set("Content-Type", "application/json").json(data);
    }
}

class UserService {
    constructor(db) {
        this.db = db;
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/login', this.loginUser.bind(this));
        this.router.post('/register', this.registerUser.bind(this));
        this.router.post('/invite', this.inviteUser.bind(this));
        this.router.get('/', this.getAllUsers.bind(this));
        this.router.get('/:id', this.getUserById.bind(this));
        this.router.put('/:id', this.updateUser.bind(this));
        this.router.delete('/:id', this.deleteUser.bind(this));
    }

    async loginUser(req, res) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 400);
        }

        const { email, password } = value;

        try {
            const result = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Invalid email or password.' }, 401);
            }

            const isMatch = await bcrypt.compare(password, result.rows[0].password);
            if (!isMatch) {
                return formatResponse(req, res, { message: 'Invalid email or password.' }, 401);
            }

            const payload = { user_id: result.rows[0].user_id, email: result.rows[0].email };
            const token = jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' });

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

            return formatResponse(req, res, {
                message: 'Login successful!',
                token: token,
                user: userProfiles,
            }, 200);

        } catch (err) {
            console.error('Login error:', err.stack);
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async registerUser(req, res) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            subscription_type_id: Joi.number().integer().optional(),
            failed_login_attempts: Joi.number().integer().optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 400);
        }

        const { email, password, subscription_type_id = 1, failed_login_attempts = 0 } = value;

        try {
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length > 0) {
                return formatResponse(req, res, { message: 'Email is already registered.' }, 400);
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await this.db.query(
                `INSERT INTO "Users" (email, password, subscription_type_id, failed_login_attempts)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, email`,
                [email, hashedPassword, subscription_type_id, failed_login_attempts]
            );

            return formatResponse(req, res, {
                message: 'User registered successfully.',
                user: {
                    id: newUser.rows[0].user_id,
                    email: newUser.rows[0].email
                }
            }, 201);

        } catch (err) {
            console.error('Register error:', err.stack);
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async inviteUser(req, res) {
        const schema = Joi.object({
            invited_user_email: Joi.string().email().required(),
            invite_by_user_id: Joi.number().integer().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 400);
        }

        const { invited_user_email, invite_by_user_id } = value;

        try {
            const inviteCheck = await this.db.query('SELECT * FROM "invitations" WHERE invited_user_email = $1 AND invite_by_user_id = $2',
                [invited_user_email, invite_by_user_id]);
            if (inviteCheck.rows.length > 0) {
                return formatResponse(req, res, { message: 'This email has already been invited.' }, 400);
            }

            await this.db.query('CALL sp_insert_into_invitations($1, $2)', [invited_user_email, invite_by_user_id]);
            return formatResponse(req, res, { message: 'Invitation sent successfully.' }, 201);

        } catch (err) {
            console.error('Invitation error:', err.stack);
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async updateUser(req, res) {
        const { id } = req.params;
        const schema = Joi.object({
            email: Joi.string().email().optional(),
            password: Joi.string().min(6).optional(),
            subscription_type_id: Joi.number().integer().optional(),
            failed_login_attempts: Joi.number().integer().optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return formatResponse(req, res, { message: error.details[0].message }, 400);
        }

        const { email, password, subscription_type_id, failed_login_attempts } = value;

        try {
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
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
                return formatResponse(req, res, { message: 'User not found.' }, 404);
            }

            return formatResponse(req, res, {
                message: 'User updated successfully.',
                user: result.rows[0]
            }, 200);

        } catch (err) {
            console.error('Update user error:', err.stack);
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async getAllUsers(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Users"');
            return formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Fetch users error:', err.stack);
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async getUserById(req, res) {
        const { id } = req.params;
        try {
            const result = await this.db.query('SELECT * FROM "Users" WHERE user_id = $1', [id]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'User not found.' }, 404);
            }
            return formatResponse(req, res, result.rows[0], 200);
        } catch (err) {
            console.error('Fetch user by id error:', err.stack);
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async deleteUser(req, res) {
        const { id } = req.params;
        const client = await this.db.pool.connect();

        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM "Profiles" WHERE user_id = $1', [id]);
            const result = await client.query('DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id', [id]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return formatResponse(req, res, { message: 'User not found.' }, 404);
            }

            await client.query('COMMIT');
            res.status(204).send();

        } catch (err) {
            console.error('Delete user error:', err.stack);
            await client.query('ROLLBACK');
            return formatResponse(req, res, { message: 'Internal server error' }, 500);
        } finally {
            client.release();
        }
    }

    getRouter() {
        return this.router;
    }

    async addUserThroughOAuth(profile) {
        try {
            const existingUserResult = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [profile.email]);
            if (existingUserResult.rows.length > 0) {
                const existingUser = existingUserResult.rows[0];
                if (!existingUser.name || !existingUser.profile_picture) {
                    const updatedUser = await this.db.query(
                        `UPDATE "Users"
                         SET name = COALESCE($1, name),
                             profile_picture = COALESCE($2, profile_picture)
                         WHERE email = $3
                         RETURNING *`,
                        [
                            profile.displayName || profile.given_name || 'Unknown',
                            profile.picture || null,
                            profile.email
                        ]
                    );
                    return updatedUser.rows[0];
                }
                return existingUser;
            }

            const newUser = await this.db.query(
                `INSERT INTO "Users" (email, name, profile_picture)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [
                    profile.email,
                    profile.displayName || profile.given_name || 'Unknown',
                    profile.picture || null
                ]
            );
            return newUser.rows[0];
        } catch (error) {
            console.error('Error adding/updating user through OAuth:', error);
            throw error;
        }
    }
}

module.exports = UserService;