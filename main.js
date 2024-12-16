
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
        this.services = [];
    }

    async initialize() {
        try {
            console.log('Initializing database connection...');
            this.db = new Database(this.dbConfig);
            await this.db.testConnection();
            console.log('Database initialized successfully!');

            this.setupMiddleware();
            this.initializeServices();
            this.startServer();
        } catch (error) {
            console.error('Failed to initialize the application:', error.message);
            process.exit(1); // Exit on failure
        }
    }

    setupMiddleware() {
        // Parse incoming JSON requests
        this.app.use(express.json());

        // Serve static files (e.g., HTML, JS, CSS)
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Basic health check route
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', message: 'Server is running!' });
        });

        console.log('Middleware initialized.');
    }

    initializeServices() {
        console.log('Initializing services...');

        // Register all services dynamically
        this.services = [
            { path: '/users', service: new UserService(this.db) },
            { path: '/profiles', service: new ProfileService(this.db) },
            { path: '/exports', service: new ExportService(this.db) },
        ];

        this.services.forEach(({ path, service }) => {
            this.app.use(path, service.getRouter());
            console.log(`Service mounted at ${path}`);
        });

        // Initialize AuthService separately for OAuth (as it directly modifies the app)
        new AuthService(this.app, new UserService(this.db), this.db);

        console.log('All services initialized successfully.');
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received. Closing app...');
            await this.shutdown();
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT signal received. Closing app...');
            await this.shutdown();
        });
    }

    async shutdown() {
        try {
            if (this.db) {
                await this.db.closeConnection();
                console.log('Database connection closed.');
            }
            console.log('Application shutdown successfully.');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error.message);
            process.exit(1);
        }
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
