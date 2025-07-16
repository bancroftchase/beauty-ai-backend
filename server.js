const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk'); // Claude

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Claude Client
const claude = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ Claude Endpoint
app.post('/ask-claude', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'Category required' });

  try {
    const prompt = `Suggest 10 beauty products for category: ${category}. 
    Return JSON array with keys: name, description, price, image.`;

    const response = await claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const products = JSON.parse(text); // AI should return JSON
    res.json({ products });
  } catch (error) {
    console.error('Claude API error:', error.message);
    res.status(500).json({ error: 'Claude API failed' });
  }
});

// ✅ Rainforest Fallback Endpoint
app.post('/fallback-products', async (req, res) => {
  const { category } = req.body;
  try {
    const response = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: category,
      },
    });

    const products = response.data.search_results.map(item => ({
      name: item.title,
      description: item.subtitle || 'Great product',
      price: item.price ? item.price.value : 'N/A',
      image: item.image || '',
    }));

    res.json({ products });
  } catch (error) {
    console.error('Rainforest API error:', error.message);
    res.status(500).json({ error: 'Rainforest API failed' });
  }
});

// ✅ Default route
app.get('/', (req, res) => res.send('✅ Beauty AI Backend is running'));

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
