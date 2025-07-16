const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

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

// ✅ Route: AI Chat (OpenAI)
app.post('/ask-openai', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const openAIResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o', // You can change to 'gpt-4' or 'gpt-3.5-turbo'
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = openAIResponse.data.choices[0]?.message?.content || '🤖 No response generated.';
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OpenAI API call failed.' });
  }
});

// ✅ Route: Rainforest API for Product Search
app.post('/product-search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const response = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: query
      }
    });

    const products = response.data.search_results || [];
    res.json({ products });
  } catch (error) {
    console.error('Rainforest API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Rainforest API call failed.' });
  }
});

// ✅ Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Beauty AI Backend running on port ${PORT}`);
});
