require('dotenv').config(); // Load environment variables

const express = require('express');
const path = require('path');
const Database = require('./Database'); // Database connection
const UserService = require('./services/UserService'); // User service
const ProfileService = require('./services/ProfileService'); // Profile service
const SubscriptionService = require('./services/SubscriptionService'); // Subscription service
const AuthService = require('./services/AuthService'); // Google OAuth service
const ExportService = require('./services/ExportService'); // Export service
const WatchHistoryService = require('./services/WatchHistoryService');
const WatchlistService = require('./services/WatchlistService');
const PreferenceService = require('./services/PreferenceService');
const QualityService = require('./services/QualityService');
const LanguageService = require('./services/LanguageService');
const SubtitleService = require('./services/SubtitleService');
const WatchableService = require('./services/WatchableService');
const js2xmlparser = require("js2xmlparser");
const setupSwagger = require("./swagger");
const TokenService = require('./services/TokenService');




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
            setupSwagger(this.app);
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
            const format = req.query.format;
            const response = {
                status: 'OK',
                message: 'Server is running!'
            };
            if (format === 'xml') {
                res.status(200).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", response));
            } else {
                res.status(200).json(response);
            }
        });

        console.log('Middleware initialized.');
    }

    initializeServices() {
        console.log('Initializing services...');

        // Register all services dynamically
        this.services = [
            {path: '/users', service: new UserService(this.db)},
            {path: '/profiles', service: new ProfileService(this.db)},
            {path: '/exports', service: new ExportService(this.db)},
            {path: '/subscriptions', service: new SubscriptionService(this.db)},
            {path: '/watch-history', service: new WatchHistoryService(this.db)},
            {path: '/watchlist', service: new WatchlistService(this.db)},
            {path: '/preference', service: new PreferenceService(this.db)},
            {path: '/quality', service: new QualityService(this.db)},
            {path: '/language', service: new LanguageService(this.db)},
            {path: '/subtitles', service:new SubtitleService(this.db)},
            {path: '/watchable', service: new WatchableService(this.db)}
            
        ];
        const tokenService = new TokenService();

        this.services.forEach(({path, service}) => {
            this.app.use(path, (req, res, next) => {
                const format = req.query.format;
                res.formatResponse = (data, status = 200) => {
                    if (format === 'xml') {
                        res.status(status).set("Content-Type", "application/xml").send(js2xmlparser.parse("response", data));
                    } else {
                        res.status(status).json(data);
                    }
                };
                next();
            });
            this.app.use(path, service.getRouter());
            console.log(`Service mounted at ${path}`);
        });

        // Initialize AuthService separately for OAuth (as it directly modifies the app)
        new AuthService(this.app, new UserService(this.db), this.db, tokenService);


        console.log('All services initialized successfully.');
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
            console.log(`Swagger docs available at http://localhost:${this.port}/api-docs`);

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
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
};

// Initialize and start the application
const appInstance = new App(config);
appInstance.initialize();
