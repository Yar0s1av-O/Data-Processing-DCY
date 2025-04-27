const express = require('express');
const bcrypt = require('bcrypt');
const js2xmlparser = require("js2xmlparser");
const jwt = require('jsonwebtoken');

function formatResponse(req, res, data, status = 200) {
    const acceptHeader = req.headers.accept;
    const urlFormat = req.query.format;

    if ((urlFormat && urlFormat.toLowerCase() === 'xml') ||
        (acceptHeader && acceptHeader.includes("application/xml"))) {
        res.status(status).set("Content-Type", "application/xml");
        res.send(js2xmlparser.parse("response", data));
    } else {
        res.status(status).set("Content-Type", "application/json");
        res.json(data);
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
        const { email, password } = req.body;
        if (!email || !password) {
            return formatResponse(req, res, { message: 'Email and password are required!' }, 400);
        }
        try {
            const result = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'Email or password is incorrect.' }, 404);
            }
            const storedHashedPassword = result.rows[0].password;
            const isMatch = await bcrypt.compare(password, storedHashedPassword);
            if (!isMatch) {
                return formatResponse(req, res, { message: 'Email or password is incorrect.' }, 404);
            }

            const payload = {
                user_id: result.rows[0].user_id,
                email: result.rows[0].email,
            };
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

            formatResponse(req, res, {
                message: 'Login successful!',
                token: token,
                user: userProfiles,
            }, 200);
        } catch (err) {
            console.error('Error during login:', err.stack);
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async registerUser(req, res) {
        const { email, password, subscription_type_id = 1, failed_login_attempts = 0 } = req.body;
        if (!email || !password) {
            return formatResponse(req, res, { message: 'Email and password are required!' }, 400);
        }
        try {
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
            if (userCheck.rows.length > 0) {
                return formatResponse(req, res, { message: 'Email is already registered!' }, 400);
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await this.db.query(
                `INSERT INTO public."Users" (email, password, subscription_type_id, failed_login_attempts)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, email`,
                [email, hashedPassword, subscription_type_id, failed_login_attempts]
            );

            formatResponse(req, res, {
                message: 'User registered successfully!',
                user: {
                    id: newUser.rows[0].user_id,
                    email: newUser.rows[0].email
                }
            }, 201);
        } catch (err) {
            console.error('Error during registration:', err.stack);
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async inviteUser(req, res) {
        const { invited_user_email, invite_by_user_id } = req.body;
        if (!invited_user_email || !invite_by_user_id) {
            return formatResponse(req, res, { message: 'invited_user_email and invite_by_user_id are required!' }, 400);
        }
        try {
            const inviteCheck = await this.db.query(
                'SELECT * FROM public."invitations" WHERE invited_user_email = $1 and invite_by_user_id = $2',
                [invited_user_email, invite_by_user_id]
            );
            if (inviteCheck.rows.length > 0) {
                return formatResponse(req, res, { message: 'This email is already invited!' }, 400);
            }

            await this.db.query(
                'CALL sp_insert_into_invitations($1, $2)',
                [invited_user_email, invite_by_user_id]
            );

            formatResponse(req, res, { message: 'Invitation created successfully!' }, 201);
        } catch (err) {
            console.error('Error during invitation creation:', err.stack);
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async getAllUsers(req, res) {
        try {
            const result = await this.db.query('SELECT * FROM "Users"');
            formatResponse(req, res, result.rows, 200);
        } catch (err) {
            console.error('Error fetching users:', err.stack);
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

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
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async updateUser(req, res) {
        const { id } = req.params;
        const { email, password, subscription_type_id, failed_login_attempts } = req.body;

        if (!email && !password && !subscription_type_id && !failed_login_attempts) {
            return formatResponse(req, res, { message: 'At least one field must be provided to update.' }, 400);
        }

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
                return formatResponse(req, res, { message: 'User not found' }, 404);
            }

            formatResponse(req, res, {
                message: 'User updated successfully!',
                user: result.rows[0],
            }, 200);
        } catch (err) {
            console.error('Error updating user:', err.stack);
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }

    async deleteUser(req, res) {
        const { id } = req.params;
    
        const client = await this.db.pool.connect(); // Get a dedicated connection
    
        try {
            await client.query('BEGIN'); // Start Transaction
    
            // Step 1: Delete related profiles first
            await client.query('DELETE FROM "Profiles" WHERE user_id = $1', [id]);
    
            // Step 2: Delete the user itself
            const result = await client.query(
                'DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id',
                [id]
            );
    
            if (result.rows.length === 0) {
                await client.query('ROLLBACK'); // Cancel transaction if user not found
                return formatResponse(req, res, { message: 'User not found' }, 404);
            }
    
            await client.query('COMMIT'); // Everything OK: Commit transaction
            res.status(204).send(); // No Content
    
        } catch (err) {
            console.error('Error deleting user and related data:', err.stack);
            await client.query('ROLLBACK'); // Error happened: Rollback
            formatResponse(req, res, { message: 'Internal server error', error: err.message }, 500);
        } finally {
            client.release(); // Always release the connection back to the pool
        }
    }
    
    

    async deleteUser(req, res) {
        const { id } = req.params;
    
        try {
            // Step 1: Delete related profiles
            await this.db.query('DELETE FROM "Profiles" WHERE user_id = $1', [id]);
    
            // Step 2: Delete the user itself
            const result = await this.db.query(
                'DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id',
                [id]
            );
    
            if (result.rows.length === 0) {
                return formatResponse(req, res, { message: 'User not found' }, 404);
            }
    
            res.status(204).send(); // 204 No Content
        } catch (err) {
            console.error('Error deleting user:', err.stack);
            formatResponse(req, res, { message: 'Internal server error' }, 500);
        }
    }
    
    

    getRouter() {
        return this.router;
    }
}

module.exports = UserService;
