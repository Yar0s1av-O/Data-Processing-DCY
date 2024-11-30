const express = require('express'); // Import express
const path = require('path');
const app = require('./index'); // Import the app instance from index.js

// Serve static files if needed (e.g., public folder)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 4000; // Define the port

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
