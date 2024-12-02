const express = require('express');
const UserService = require('./UserService');
const Database = require('./Database');

const PORT = process.env.PORT || 4000;

async function startApp() {
    try {
        // Initialize the database
        const db = new Database({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: 'Dera1372@',
            port: 5432,
        });

        // Initialize Express app
        const app = express();
        app.use(express.json()); // Parse JSON requests

        // Initialize services
        const userService = new UserService(db);

        // Attach routes
        app.use('/Users', userService.getRouter());

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received. Closing app...');
            await db.closeConnection();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start the application:', error);
    }
}

startApp();
