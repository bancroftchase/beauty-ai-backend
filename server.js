const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Route: Get Client IP
app.get('/clientIP', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.json({ ip });
});

// ✅ Route: Talk to Gemini
app.post('/ask-gemini', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Gemini API call failed.' });
  }
});

// ✅ Catch-all for unknown routes (must be LAST)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Beauty AI Backend running on port ${PORT}`);
});
