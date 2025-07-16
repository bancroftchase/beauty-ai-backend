const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Claude Setup
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// ✅ Test Route
app.get('/', (req, res) => {
  res.json({ status: '✅ Beauty AI Backend is running' });
});

// ✅ Route: AI Product Recommendations (Claude)
app.post('/ask-claude', async (req, res) => {
  const { category } = req.body;

  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'Category is required.' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Suggest 5 high-quality beauty products for: ${category}.
          Respond ONLY in JSON format like this:
          {
            "products": [
              { "name": "Product Name", "price": "$XX", "description": "Short description" }
            ]
          }`
        }
      ]
    });

    // Extract JSON from Claude's text
    const aiReply = response.content[0].text;
    const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { products: [] };

    res.json(data);
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Claude API request failed.' });
  }
});

// ✅ Route: Fallback using Rainforest API
app.post('/fallback-products', async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  try {
    const rainforestResponse = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: category
      }
    });

    const products = (rainforestResponse.data.search_results || []).slice(0, 5).map(item => ({
      name: item.title,
      price: item.price?.raw || 'N/A',
      description: item.asin || 'Amazon product'
    }));

    res.json({ products });
  } catch (error) {
    console.error('Rainforest API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Fallback API request failed.' });
  }
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Beauty AI Backend running on port ${PORT}`);
});
