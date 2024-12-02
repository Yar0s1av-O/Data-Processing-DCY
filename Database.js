
const { Pool } = require('pg');

class Database {
    constructor(config) {
        this.pool = new Pool(config);
        this.testConnection();
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            console.log('Connected to the PostgreSQL database!');
            client.release();
        } catch (err) {
            console.error('Database connection error:', err.stack);
        }
    }

    async query(text, params) {
        return this.pool.query(text, params); // Simplified query interface
    }

    async closeConnection() {
        await this.pool.end();
        console.log('Database connection closed.');
    }
}

module.exports = Database;
