const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Dataset with ~3100 products (keeping same as before)
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

const categoryCounts = BEAUTY_PRODUCTS.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] || 0) + 1;
  return acc;
}, {});

console.log(`🚀 BEAUTY_PRODUCTS total: ${BEAUTY_PRODUCTS.length}`);

// Query aliases
const QUERY_ALIASES = {
  'skincare': ['k-beauty', 'anti-aging', 'eye care'],
  'antiaging': ['anti-aging'],
  'kbeauty': ['k-beauty'],
  'eyecare': ['eye care'],
  'lipproducts': ['lip products'],
  'natural': ['global', 'k-beauty'],
  'organic': ['global', 'k-beauty']
};

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Request-ID'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));

// Enhanced Rainforest API search
async function searchRainforest(query) {
  if (!process.env.RAINFOREST_API_KEY) {
    console.log('🌧️ Rainforest API key not available');
    return [];
  }
  
  try {
    console.log(`🌧️ Rainforest searching for: "${query}"`);
    
    const response = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: query,
        category_id: 'beauty',
        max_page: 2
      },
      timeout: 10000
    });
    
    if (response.data.search_results) {
      const products = response.data.search_results.map((item, index) => ({
        id: item.asin || `rainforest-${query}-${index}`,
        name: item.title || `Beauty Product ${index + 1}`,
        brand: item.brand || 'Premium Beauty',
        price: parseFloat(item.price?.value) || (Math.random() * 50 + 10),
        description: item.description || item.title || 'High-quality beauty product from Amazon',
        country: 'USA',
        category: 'beauty'
      }));
      
      console.log(`🌧️ Rainforest found ${products.length} products`);
      return products;
    }
    
    return [];
    
  } catch (error) {
    console.error('🌧️ Rainforest API error:', error.message);
    return [];
  }
}

// Gemini API search function
async function queryGemini(query, context) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('💎 Gemini API key not available');
    return [];
  }
  
  try {
    console.log(`💎 Gemini searching for: "${query}"`);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Generate 30-50 diverse beauty products for the search term "${query}" in the context of ${context}. 

Include products from various countries (USA, South Korea, Japan, France, Germany, UK, Australia, Canada, Brazil, India, Italy) and different price ranges ($5-$200).

For each product, provide:
- id: "gemini-[unique-id]"
- name: realistic product name
- brand: realistic brand name
- price: number between 5 and 200
- description: detailed description
- country: country of origin
- category: skincare, makeup, haircare, fragrance, or beauty

Return ONLY a valid JSON array with no other text:
[{"id":"gemini-1","name":"Ultra Hydrating Face Serum","brand":"Seoul Glow","price":45.99,"description":"Advanced Korean skincare with hyaluronic acid","country":"South Korea","category":"skincare"}]`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    console.log(`💎 Gemini raw response length: ${responseText.length}`);
    
    // Extract JSON from response
    let jsonData = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const arrayMatch = jsonData.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonData = arrayMatch[0];
    }
    
    const products = JSON.parse(jsonData);
    console.log(`💎 Gemini generated ${products.length} products`);
    
    return products.map((product, index) => ({
      id: product.id || `gemini-${query}-${index}`,
      name: product.name || `Beauty Product ${index + 1}`,
      brand: product.brand || 'Premium Beauty',
      price: Number(product.price) || (Math.random() * 100 + 15),
      description: product.description || `High-quality beauty product for ${query}`,
      country: product.country || 'Global',
      category: product.category || 'beauty'
    }));
    
  } catch (error) {
    console.error('💎 Gemini API error:', error.message);
    return [];
  }
}

// ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beauty AI Backend - Gemini Test Version',
    endpoints: ['/health', '/api/products/search', '/api/chat/gemini', '/debug/keys', '/test/all-products'],
    totalProducts: BEAUTY_PRODUCTS.length,
    version: '2.1-gemini-test'
  });
});

// HEALTH ENDPOINT
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    productsCount: BEAUTY_PRODUCTS.length,
    timestamp: new Date().toISOString(),
    rainforestEnabled: !!process.env.RAINFOREST_API_KEY,
    geminiEnabled: !!process.env.GEMINI_API_KEY
  });
});

// DEBUG: API KEYS STATUS
app.get('/debug/keys', (req, res) => {
  console.log('🔑 Debug: Checking API keys');
  res.json({
    rainforestEnabled: !!process.env.RAINFOREST_API_KEY,
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    rainforestKeyLength: process.env.RAINFOREST_API_KEY ? process.env.RAINFOREST_API_KEY.length : 0,
    geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('API') || key.includes('KEY')),
    timestamp: new Date().toISOString()
  });
});

// TEST: ALL PRODUCTS
app.get('/test/all-products', (req, res) => {
  console.log(`📊 Returning ALL ${BEAUTY_PRODUCTS.length} products`);
  
  res.json({
    success: true,
    totalProducts: BEAUTY_PRODUCTS.length,
    products: BEAUTY_PRODUCTS,
    categories: categoryCounts
  });
});

// MAIN SEARCH ENDPOINT
app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase().trim() : 'global';
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).slice(2);
  
  console.log(`\n🔍 SEARCH START - Query: "${query}", ID: ${requestId}`);
  
  try {
    let allProducts = [];
    let apiSources = [];

    // Run APIs in parallel
    const apiPromises = [];

    if (process.env.RAINFOREST_API_KEY && query !== 'global') {
      apiPromises.push(
        searchRainforest(query)
          .then(products => ({ source: 'rainforest', products }))
          .catch(() => ({ source: 'rainforest', products: [] }))
      );
    }

    if (process.env.GEMINI_API_KEY && query !== 'global') {
      apiPromises.push(
        queryGemini(query, 'beauty products')
          .then(products => ({ source: 'gemini', products }))
          .catch(() => ({ source: 'gemini', products: [] }))
      );
    }

    // Execute APIs
    if (apiPromises.length > 0) {
      console.log(`🚀 Running ${apiPromises.length} API calls...`);
      const results = await Promise.all(apiPromises);
      
      results.forEach(result => {
        if (result.products.length > 0) {
          allProducts.push(...result.products);
          apiSources.push(result.source);
          console.log(`✅ ${result.source}: ${result.products.length} products`);
        }
      });
    }

    // Add local products
    console.log(`📚 Adding local products...`);
    
    let categoriesToMatch = [query];
    if (QUERY_ALIASES[query]) {
      categoriesToMatch.push(...QUERY_ALIASES[query]);
    }
    
    const localProducts = BEAUTY_PRODUCTS.filter(product => {
      if (!product) return false;
      
      const searchTerms = query.split(' ');
      
      return query === 'global' ||
        categoriesToMatch.some(cat => product.category?.toLowerCase().includes(cat)) ||
        searchTerms.some(term => 
          product.category?.toLowerCase().includes(term) ||
          product.name?.toLowerCase().includes(term) ||
          product.brand?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.country?.toLowerCase().includes(term)
        );
    });
    
    allProducts.push(...localProducts);
    apiSources.push('local');
    console.log(`📚 Local: ${localProducts.length} products`);

    // Remove duplicates
    const uniqueProducts = [];
    const seenNames = new Set();
    
    allProducts.forEach(product => {
      const key = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueProducts.push(product);
      }
    });

    // Shuffle
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    const sourceString = apiSources.join('+');
    
    console.log(`🎉 FINAL: ${uniqueProducts.length} products from [${sourceString}]`);
    
    // RETURN ALL PRODUCTS - NO LIMITS
    res.json({
      success: true,
      products: uniqueProducts,
      stats: {
        productCount: uniqueProducts.length,
        source: sourceString,
        rainforestCount: allProducts.filter(p => p.id?.includes('rainforest')).length,
        geminiCount: allProducts.filter(p => p.id?.includes('gemini')).length,
        localCount: localProducts.length,
        requestId: requestId
      }
    });
    
  } catch (error) {
    console.error(`❌ Search error:`, error.message);
    res.status(500).json({
      success: false,
      products: [],
      error: error.message
    });
  }
});

// CHAT ENDPOINT WITH GEMINI
app.post('/api/chat/gemini', async (req, res) => {
  const { message, context } = req.body || {};
  
  if (!message) {
    return res.status(400).json({ 
      success: false, 
      products: [], 
      error: 'Message is required' 
    });
  }
  
  try {
    const searchQuery = message.toLowerCase().trim();
    let allProducts = [];
    let sources = [];

    // Parallel API execution
    const promises = [];

    if (process.env.RAINFOREST_API_KEY) {
      promises.push(
        searchRainforest(searchQuery)
          .then(products => ({ source: 'rainforest', products }))
          .catch(() => ({ source: 'rainforest', products: [] }))
      );
    }

    if (process.env.GEMINI_API_KEY) {
      promises.push(
        queryGemini(searchQuery, context || 'beauty')
          .then(products => ({ source: 'gemini', products }))
          .catch(() => ({ source: 'gemini', products: [] }))
      );
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result.products.length > 0) {
          allProducts.push(...result.products);
          sources.push(result.source);
        }
      });
    }

    // Add local products
    const searchTerms = searchQuery.split(' ').filter(t => t.length > 2);
    const localProducts = BEAUTY_PRODUCTS.filter(product => {
      return searchTerms.some(term =>
        product.name?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term)
      ) || searchQuery === 'global';
    });

    allProducts.push(...localProducts);
    sources.push('local');

    // Deduplicate and shuffle
    const uniqueProducts = [];
    const seen = new Set();
    
    allProducts.forEach(product => {
      const key = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProducts.push(product);
      }
    });

    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    res.json({
      success: true,
      products: uniqueProducts,
      stats: {
        productCount: uniqueProducts.length,
        source: sources.join('+')
      }
    });

  } catch (error) {
    console.error(`💬 Chat error:`, error.message);
    res.status(500).json({
      success: false,
      products: [],
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Beauty AI Backend (Gemini Test) running on port ${port}`);
  console.log(`📊 ${BEAUTY_PRODUCTS.length} local products loaded`);
  console.log(`🌧️ Rainforest API: ${process.env.RAINFOREST_API_KEY ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  console.log(`💎 Gemini API: ${process.env.GEMINI_API_KEY ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  console.log(`🔍 Environment variables containing 'API' or 'KEY':`);
  Object.keys(process.env).filter(key => key.includes('API') || key.includes('KEY')).forEach(key => {
    console.log(`   ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  });
  console.log();
});
