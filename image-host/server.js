require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Middleware for API Key Authentication
const apiKeyAuth = (req, res, next) => {
  const userApiKey = req.headers['x-api-key'];

  if (!userApiKey) {
    return res.status(401).json({ error: 'Unauthorized: API key is missing.' });
  }

  if (userApiKey !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key.' });
  }

  next();
};

// Apply the API key authentication middleware to the /images route
app.use('/images', apiKeyAuth, express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Image host server is running on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('Warning: API_KEY is not set. Please check your .env file.');
  }
});
