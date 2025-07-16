const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Claude Setup
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ✅ Claude AI Endpoint
app.post('/ask-claude', async (req, res) => {
  const { category } = req.body;

  if (!category) return res.status(400).json({ error: 'Category is required' });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `List 50 trending ${category} beauty products in JSON format with fields: name, description, price, image.`
      }]
    });

    const rawText = response.content[0]?.text || '';
    let products = [];

    // Attempt to parse JSON
    try {
      products = JSON.parse(rawText);
    } catch (err) {
      console.error('Claude JSON parse error:', err.message);
    }

    if (products.length === 0) {
      return res.json({ source: 'claude', products: [] });
    }

    res.json({ source: 'claude', products });
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Claude API call failed.' });
  }
});

// ✅ Rainforest Fallback
app.post('/fallback-products', async (req, res) => {
  const { category } = req.body;

  if (!category) return res.status(400).json({ error: 'Category is required' });

  try {
    const rainforestResponse = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: category
      }
    });

    const items = rainforestResponse.data.search_results || [];
    const products = items.slice(0, 50).map(item => ({
      name: item.title,
      description: 'Amazon Product',
      price: item.price?.value ? `$${item.price.value}` : 'N/A',
      image: item.image || 'https://via.placeholder.com/150'
    }));

    res.json({ source: 'rainforest', products });
  } catch (error) {
    console.error('Rainforest API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Rainforest API call failed.' });
  }
});

// ✅ Health Check
app.get('/check-env', (req, res) => {
  res.json({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing',
    RAINFOREST_API_KEY: process.env.RAINFOREST_API_KEY ? '✅ Set' : '❌ Missing'
  });
});

app.listen(PORT, () => console.log(`✅ Beauty AI Backend running on port ${PORT}`));
