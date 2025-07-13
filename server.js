// ✅ Ensure JSON parsing is enabled (should already be near the top of your server.js)
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const app = express();
const port = process.env.PORT || 3000;

// Dataset with ~3100 products
const BEAUTY_PRODUCTS = [
  ...Array.from({ length: 600 }, (_, i) => ({
    name: `Anti Aging Serum ${i + 1}`,
    category: "anti-aging",
    brand: `AgeDefy${Math.floor(i / 50) + 1}`,
    price: Number((20 + Math.random() * 100).toFixed(2)),
    description: `Reduces wrinkles and boosts firmness, #${i + 1}.`,
    country: ["USA", "France", "Japan", "South Korea"][Math.floor(Math.random() * 4)],
    id: `antiaging-${i + 1}`
  })),
  ...Array.from({ length: 600 }, (_, i) => ({
    name: `K Beauty Essence ${i + 1}`,
    category: "k-beauty",
    brand: `KBeauty${Math.floor(i / 50) + 1}`,
    price: Number((10 + Math.random() * 60).toFixed(2)),
    description: `Hydrating essence for radiant skin, #${i + 1}.`,
    country: "South Korea",
    id: `kbeauty-${i + 1}`
  })),
  ...Array.from({ length: 500 }, (_, i) => ({
    name: `Eye Cream ${i + 1}`,
    category: "eye care",
    brand: `EyeCare${Math.floor(i / 50) + 1}`,
    price: Number((15 + Math.random() * 70).toFixed(2)),
    description: `Reduces puffiness and dark circles, #${i + 1}.`,
    country: ["USA", "UK", "Germany"][Math.floor(Math.random() * 3)],
    id: `eyecare-${i + 1}`
  })),
  ...Array.from({ length: 400 }, (_, i) => ({
    name: `Tanning Lotion ${i + 1}`,
    category: "tanning",
    brand: `TanGlow${Math.floor(i / 50) + 1}`,
    price: Number((12 + Math.random() * 50).toFixed(2)),
    description: `Natural glow tanning lotion, #${i + 1}.`,
    country: ["Australia", "USA"][Math.floor(Math.random() * 2)],
    id: `tanning-${i + 1}`
  })),
  ...Array.from({ length: 400 }, (_, i) => ({
    name: `Eyelash Serum ${i + 1}`,
    category: "eyelashes",
    brand: `LashBoost${Math.floor(i / 50) + 1}`,
    price: Number((25 + Math.random() * 80).toFixed(2)),
    description: `Enhances lash growth, #${i + 1}.`,
    country: ["USA", "France"][Math.floor(Math.random() * 2)],
    id: `eyelashes-${i + 1}`
  })),
  ...Array.from({ length: 400 }, (_, i) => ({
    name: `Lip Gloss ${i + 1}`,
    category: "lip products",
    brand: `LipShine${Math.floor(i / 50) + 1}`,
    price: Number((5 + Math.random() * 25).toFixed(2)),
    description: `Hydrating and glossy lip product, #${i + 1}.`,
    country: ["USA", "Canada"][Math.floor(Math.random() * 2)],
    id: `lipproducts-${i + 1}`
  })),
  ...Array.from({ length: 200 }, (_, i) => ({
    name: `Global Beauty Product ${i + 1}`,
    category: "global",
    brand: `WorldBeauty${Math.floor(i / 20) + 1}`,
    price: Number((10 + Math.random() * 120).toFixed(2)),
    description: `Unique beauty product from global trends, #${i + 1}.`,
    country: ["Brazil", "India", "Italy", "South Africa"][Math.floor(Math.random() * 4)],
    id: `global-${i + 1}`
  }))
].filter(p => p && p.name && p.category && p.brand && p.price && p.description && p.id);

// Log dataset breakdown
const categoryCounts = BEAUTY_PRODUCTS.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] || 0) + 1;
  return acc;
}, {});
console.log(`BEAUTY_PRODUCTS total: ${BEAUTY_PRODUCTS.length}`);
console.log('Category breakdown:', JSON.stringify(categoryCounts));

// Query alias mapping
const QUERY_ALIASES = {
  'skincare': ['k-beauty', 'anti-aging', 'eye care'],
  'antiaging': ['anti-aging'],
  'kbeauty': ['k-beauty'],
  'eyecare': ['eye care'],
  'lipproducts': ['lip products'],
  'haircare': [],
  'tools': [],
  'natural': ['global', 'k-beauty'],
  'organic': ['global', 'k-beauty']
};

app.use(cors({
  origin: ['https://beauty-static-live.onrender.com', 'https://beautystatic.onrender.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Search Rainforest API
async function searchRainforest(query) {
  try {
    const response = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: query,
        category_id: 'beauty'
      },
      timeout: 5000
    });
    if (response.data.search_results) {
      return response.data.search_results.map(item => ({
        id: item.asin || `rainforest-${Math.random().toString(36).slice(2)}`,
        name: item.title || 'Unknown Product',
        brand: item.brand || 'Unknown Brand',
        price: parseFloat(item.price?.value || 0),
        description: item.description || 'No description available',
        country: 'USA',
        category: 'beauty'
      }));
    }
    return [];
  } catch (error) {
    console.error('Rainforest API error:', error.message);
    return [];
  }
}

// Query Claude
async function queryClaude(query, context) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `In the context of ${context}, list beauty products matching "${query}". Format as JSON array of objects with id, name, brand, price (number), description, country, category.`
      }]
    });
    return JSON.parse(response.content[0].text || '[]');
  } catch (error) {
    console.error('Claude API error:', error.message);
    return [];
  }
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Luminous AI Backend',
    endpoints: ['/health', '/api/products/search', '/api/chat/claude']
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    productsCount: BEAUTY_PRODUCTS.length,
    categoryBreakdown: categoryCounts,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.log(`Search query: ${query}, requestID: ${requestId}`);
  try {
    let products = [];
    let source = 'local';

    if (process.env.RAINFOREST_API_KEY && query) {
      products = await searchRainforest(query);
      if (products.length > 0) source = 'rainforest';
    }

    if (products.length === 0) {
      let categoriesToMatch = [query];
      if (QUERY_ALIASES[query]) {
        categoriesToMatch = QUERY_ALIASES[query];
      }
      products = BEAUTY_PRODUCTS.filter(product =>
        product && (
          query === '' || query === 'global' ||
          categoriesToMatch.some(cat => product.category?.toLowerCase() === cat) ||
          product.category?.toLowerCase().includes(query) ||
          product.name?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.country?.toLowerCase().includes(query)
        )
      );
    }

    console.log(`Returning ${products.length} products for query: ${query}, source: ${source}`);
    res.json({
      success: true,
      products: products.slice(0, 200),
      stats: {
        productCount: products.length,
        source
      }
    });
  } catch (error) {
    console.error(`Search error: ${error.message}, requestID: ${requestId}`);
    res.status(500).json({
      success: false,
      products: [],
      stats: { productCount: 0, source: 'none' }
    });
  }
});

app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body || {};
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.log(`Chat query: ${message}, Context: ${context}, requestID: ${requestId}`);
  if (!message || !context) {
    return res.status(400).json({ success: false, products: [], error: 'Missing message or context' });
  }
  try {
    const timeout = setTimeout(() => {
      console.error(`Chat request timeout for query: ${message}, requestID: ${requestId}`);
      res.status(503).json({ success: false, products: [], error: 'Request timeout' });
    }, 10000);

    let products = [];
    let source = 'local';
    let searchQuery = message.toLowerCase().replace(/[^a-z0-9-]/g, ' ');

    if (process.env.ANTHROPIC_API_KEY) {
      products = await queryClaude(searchQuery, context);
      if (products.length > 0) source = 'claude';
    }

    if (products.length === 0 && process.env.RAINFOREST_API_KEY) {
      products = await searchRainforest(searchQuery);
      if (products.length > 0) source = 'rainforest';
    }

    if (products.length === 0) {
      let categoriesToMatch = [];
      const queryTerms = searchQuery.split(' ').filter(term => term);
      queryTerms.forEach(term => {
        if (QUERY_ALIASES[term]) {
          categoriesToMatch.push(...QUERY_ALIASES[term]);
        } else {
          categoriesToMatch.push(term);
        }
      });
      categoriesToMatch = [...new Set(categoriesToMatch)];
      products = BEAUTY_PRODUCTS.filter(product =>
        product && (
          queryTerms.includes('global') ||
          categoriesToMatch.some(cat => product.category?.toLowerCase() === cat) ||
          queryTerms.some(term =>
            product.category?.toLowerCase().includes(term) ||
            product.name?.toLowerCase().includes(term) ||
            product.brand?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term) ||
            product.country?.toLowerCase().includes(term)
          )
        )
      );
    }

    clearTimeout(timeout);
    console.log(`Returning ${products.length} products for query: ${message}, source: ${source}`);
    res.json({
      success: true,
      products: products.slice(0, 200),
      stats: {
        productCount: products.length,
        source
      }
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error(`Chat error: ${error.message}, requestID: ${requestId}`);
    res.status(500).json({ success: false, products: [], error: 'Failed to process chat request' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

