const express = require('express');
const path = require('path');
const UserService = require('./UserService');
const ProfileService = require('./ProfileService');
const Database = require('./Database');

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
        // Parse JSON requests
        this.app.use(express.json());

        // Serve static files
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Default route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
    }

    initializeServices() {
        // Initialize user-related services
        const userService = new UserService(this.db);

        // Attach service routes
        this.app.use('/Users', userService.getRouter());

        // Initialize user-related services
        const profileService = new ProfileService(this.db);

        // Attach service routes
        this.app.use('/Profiles', profileService.getRouter());
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
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'Dera1372@',
        port: 5432,
    },
};

// Initialize and start the application
const appInstance = new App(config);
appInstance.initialize();
