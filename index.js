const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Import bcrypt
const pool = require('./databasepg'); // Database connection pool

const app = express();
app.use(bodyParser.json());

// Endpoint for registering a new user
app.post('/Users/register', async (req, res) => {
    const { email, password, subscription_type_id = 1 } = req.body; // Default subscription_type_id to 1

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required!' });
    }

    try {
        // Check if the email already exists
        const userCheck = await pool.query('SELECT * FROM "Users" WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email is already registered!' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the user with subscription_type_id
        const newUser = await pool.query(
            'INSERT INTO "Users" (email, password, failed_login_attempts, subscription_type_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email',
            [email, hashedPassword, 0, subscription_type_id]
        );

        res.status(201).json({
            message: 'User registered successfully!',
            user: { id: newUser.rows[0].user_id, email: newUser.rows[0].email },
        });
    } catch (err) {
        console.error('Error during registration:', err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Export the app object for server.js
module.exports = app;
