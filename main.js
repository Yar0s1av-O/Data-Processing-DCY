require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const Database = require('./Database'); // Database connection
const UserService = require('./services/UserService'); // User service
const ProfileService = require('./services/ProfileService'); // Profile service
const AuthService = require('./services/AuthService'); // Google OAuth service
const ExportService = require('./services/ExportService'); // Export service

class App {
    constructor(config) {
        this.port = config.port || 4000;
        this.dbConfig = config.dbConfig;
        this.app = express();
    }

    async initialize() {
        try {
            // Initialize the database
            this.db = new Database(this.dbConfig);
            console.log('Database initialized successfully!');

            // Initialize middleware
            this.setupMiddleware();

            // Initialize services
            this.initializeServices();

            // Start the server
            this.startServer();
        } catch (error) {
            console.error('Failed to initialize the application:', error);
        }
    }

    setupMiddleware() {
        // Middleware to parse JSON requests
        this.app.use(express.json());

        // Serve static files (e.g., index.html, script.js)
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    initializeServices() {
        // Initialize UserService
        const userService = new UserService(this.db);
        this.app.use('/users', userService.getRouter());

        // Initialize ProfileService
        const profileService = new ProfileService(this.db);
        this.app.use('/profiles', profileService.getRouter());

        // Initialize AuthService (Google OAuth)
        new AuthService(this.app, userService, this.db);

        // Initialize ExportService
        const exportService = new ExportService(this.db);
        this.app.use('/exports', exportService.getRouter());
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received. Closing app...');
            await this.db.closeConnection();
            process.exit(0);
        });
    }
}

// Configuration object
const config = {
    port: process.env.PORT || 4000,
    dbConfig: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'Dera1372@',
        port: process.env.DB_PORT || 5432,
    },
};

// Initialize and start the application
const appInstance = new App(config);
appInstance.initialize();
