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

// ✅ Route: Talk to Gemini (with RainForest fallback)
app.post('/ask-gemini', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    // ✅ Primary: Gemini API
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const reply = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply && reply.trim() !== '') {
      console.log('✅ Gemini response successful');
      return res.json({ reply });
    }

    console.warn('⚠ Gemini returned empty response. Attempting RainForest fallback...');

    // ✅ Fallback: RainForest API for product suggestions
    const rainforestResponse = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        search_term: prompt
      }
    });

    const fallbackText =
      rainforestResponse.data?.search_results?.[0]?.title ||
      'I couldn’t get an AI response, but I found some product suggestions for you!';

    return res.json({ reply: fallbackText });

  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Both Gemini and fallback failed.' });
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
