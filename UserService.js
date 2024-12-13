
const express = require('express');
const bcrypt = require('bcrypt');

class UserService {
    constructor(db) {
        this.db = db; // Use the database instance
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Define routes
        this.router.post('/register', this.registerUser.bind(this));
    }

    async registerUser(req, res) {
        const { email, password, subscription_type_id = 1, failed_login_attempts = 0 } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required!' });
        }

        try {
            // Normalize the email (convert to lowercase)
            const normalizedEmail = email.trim().toLowerCase();

            // Validate the email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({ message: 'Invalid email format!' });
            }

            // Enforce email length constraints
            if (normalizedEmail.length > 255) {
                return res.status(400).json({ message: 'Email is too long!' });
            }

            // (Optional) Check for disposable email providers
            const disposableDomains = ['mailinator.com', '10minutemail.com', 'dispostable.com']; // Add more as needed
            const emailDomain = normalizedEmail.split('@')[1];
            if (disposableDomains.includes(emailDomain)) {
                return res.status(400).json({ message: 'Disposable email addresses are not allowed!' });
            }

            // Check if the email already exists
            const userCheck = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [normalizedEmail]);
            if (userCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email is already registered!' });
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert the user into the database
            const newUser = await this.db.query(
                `INSERT INTO "Users" (email, password, subscription_type_id, failed_login_attempts)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, email`,
                [normalizedEmail, hashedPassword, subscription_type_id, failed_login_attempts]
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

    getRouter() {
        return this.router; // Expose the router
    }
}

module.exports = UserService;
