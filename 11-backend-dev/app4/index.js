const express = require('express');
const app = express();
const PORT = 3000;

// A simple route handler for the homepage
app.get('/', (req, res) => {
    res.send('Hello, World! Welcome to my Express server.');
});

// Start the server and listen on port 3000
app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});