// server.js - Beauty AI Backend with Claude Integration + Real API
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:8081', 
        'exp://192.168.*', 
        'https://your-frontend-domain.com',
        'https://beauty-ai-frontend-clean.onrender.com'  // Added frontend domain
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ... rest of your server code remains exactly the same ...

module.exports = app;
