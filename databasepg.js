const { Pool } = require('pg');

// Set up the PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',  
    host: 'localhost', 
    database: 'postgres', 
    password: 'Dera1372@', 
    port: 5432, 
});

// Test the connection
pool.connect((err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.stack);
    } else {
        console.log('Connected to the PostgreSQL database!');
    }
});

// Export the pool object
module.exports = pool;


