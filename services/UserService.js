require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const UserRepository = require('../repositories/UserRepository');
const { validateRegistration, validateLogin, validateInvite, validateUserUpdate } = require('../validators/UserValidator');

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
    this.userRepo = new UserRepository(db);
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/login', this.loginUser.bind(this));
    this.router.post('/login/oauth', this.oauthLogin.bind(this));
    this.router.post('/register', this.registerUser.bind(this));
    this.router.post('/invite', this.inviteUser.bind(this));
    this.router.get('/', this.getAllUsers.bind(this));
    this.router.get('/:id', this.getUserById.bind(this));
    this.router.put('/:id', this.updateUser.bind(this));
    this.router.delete('/:id', this.deleteUser.bind(this));
  }

  async performTransactionalOperation(callback) {
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteUser(req, res) {
    try {
      const deleted = await this.performTransactionalOperation(async (client) => {
        await client.query('DELETE FROM "Profiles" WHERE user_id = $1', [req.params.id]);
        const result = await client.query('DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id', [req.params.id]);
        if (result.rows.length === 0) throw new Error('User not found');
        return result.rows[0];
      });
      res.status(204).send();
    } catch (err) {
      console.error('Delete user error:', err);
      if (err.message === 'User not found') {
        return formatResponse(req, res, { message: 'User not found.' }, 404);
      }
      return formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async loginUser(req, res) {
    const { error, value } = validateLogin(req.body);
    if (error) return formatResponse(req, res, { message: error.details[0].message }, 400);

    try {
      const user = await this.userRepo.getUserByEmail(value.email);
      if (!user || !(await bcrypt.compare(value.password, user.password))) {
        return formatResponse(req, res, { message: 'Invalid email or password.' }, 401);
      }

      const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const userProfiles = await this.userRepo.getUserProfilesByEmail(user.email);

      return formatResponse(req, res, {
        message: 'Login successful!',
        token,
        user: userProfiles
      }, 200);

    } catch (err) {
      console.error('Login error:', err);
      return formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async oauthLogin(req, res) {
    const { email } = req.body;

    if (!email) {
      return formatResponse(req, res, { message: 'Email is required.' }, 400);
    }

    try {
      const user = await this.userRepo.getUserByEmail(email);
      if (!user) {
        return formatResponse(req, res, { message: 'OAuth user not found.' }, 404);
      }

      const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const userProfiles = await this.userRepo.getUserProfilesByEmail(user.email);

      return formatResponse(req, res, {
        message: 'OAuth login successful!',
        token,
        user: userProfiles
      }, 200);

    } catch (err) {
      console.error('OAuth login error:', err);
      return formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async registerUser(req, res) {
    const { error, value } = validateRegistration(req.body);
    if (error) return formatResponse(req, res, { message: error.details[0].message }, 400);

    try {
      const existing = await this.userRepo.getUserByEmail(value.email);
      if (existing) return formatResponse(req, res, { message: 'Email is already registered.' }, 409);

      const hashedPassword = await bcrypt.hash(value.password, 10);
      const newUser = await this.userRepo.createUser({ ...value, password: hashedPassword });

      return formatResponse(req, res, {
        message: 'User registered successfully.',
        user: { id: newUser.user_id, email: newUser.email }
      }, 201);
    } catch (err) {
      console.error('Register error:', err);
      return formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async inviteUser(req, res) {
    const { error, value } = validateInvite(req.body);
    if (error) return formatResponse(req, res, { message: error.details[0].message }, 400);

    try {
      const alreadyInvited = await this.userRepo.checkInvitation(value);
      if (alreadyInvited) return formatResponse(req, res, { message: 'This email has already been invited.' }, 409);

      await this.userRepo.insertInvitation(value);
      return formatResponse(req, res, { message: 'Invitation sent successfully.' }, 201);
    } catch (err) {
      console.error('Invite error:', err);
      return formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const { error, value } = validateUserUpdate(req.body);
    if (error) return formatResponse(req, res, { message: error.details[0].message }, 400);

    try {
      if (value.password) {
        value.password = await bcrypt.hash(value.password, 10);
      }

      const updatedUser = await this.userRepo.updateUser(id, value);
      if (!updatedUser) return formatResponse(req, res, { message: 'User not found.' }, 404);

      return formatResponse(req, res, {
        message: 'User updated successfully.',
        user: updatedUser
      }, 200);
    } catch (err) {
      console.error('Update user error:', err);
      return formatResponse(req, res, { message: 'Internal server error' }, 500);
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await this.userRepo.getAllUsers();
      return formatResponse(req, res, users, 200);
    } catch (err) {
      console.error('Get users error:', err);
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