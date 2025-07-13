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

console.log(`BEAUTY_PRODUCTS total: ${BEAUTY_PRODUCTS.length}`);

// Query alias mapping
const QUERY_ALIASES = {
  'skincare': ['k-beauty', 'anti-aging', 'eye care'],
  'antiaging': ['anti-aging'],
  'kbeauty': ['k-beauty'],
  'eyecare': ['eye care'],
  'lipproducts': ['lip products'],
  'natural': ['global', 'k-beauty'],
  'organic': ['global', 'k-beauty']
};

// CORS with broad permissions
app.use(cors({
  origin: true, // Allow all origins for testing
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Request-ID', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Enhanced Rainforest API search
async function searchRainforest(query) {
  try {
    console.log(`🌧️ Rainforest searching for: "${query}"`);
    
    const searchTerms = [query];
    if (query === 'global' || query.includes('beauty')) {
      searchTerms.push('skincare', 'makeup', 'cosmetics');
    }
    
    let allProducts = [];
    
    for (const term of searchTerms.slice(0, 2)) {
      try {
        const response = await axios.get('https://api.rainforestapi.com/request', {
          params: {
            api_key: process.env.RAINFOREST_API_KEY,
            type: 'search',
            amazon_domain: 'amazon.com',
            search_term: term,
            category_id: 'beauty',
            max_page: 2
          },
          timeout: 10000
        });
        
        if (response.data.search_results) {
          const products = response.data.search_results.map((item, index) => ({
            id: item.asin || `rainforest-${term}-${index}`,
            name: item.title || `Beauty Product ${index + 1}`,
            brand: item.brand || 'Premium Beauty',
            price: parseFloat(item.price?.value) || (Math.random() * 50 + 10),
            description: item.description || item.title || 'High-quality beauty product from Amazon',
            country: 'USA',
            category: 'beauty'
          }));
          
          allProducts.push(...products);
          console.log(`🌧️ Rainforest found ${products.length} for "${term}"`);
        }
      } catch (termError) {
        console.error(`Rainforest term "${term}" failed:`, termError.message);
      }
    }
    
    console.log(`🌧️ Rainforest total: ${allProducts.length} products`);
    return allProducts;
    
  } catch (error) {
    console.error('🌧️ Rainforest API error:', error.message);
    return [];
  }
}

// Enhanced Claude API search
async function queryClaude(query, context) {
  try {
    console.log(`🤖 Claude searching for: "${query}"`);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Generate 30-50 diverse beauty products for the search term "${query}".

Include products from various countries: USA, South Korea, Japan, France, Germany, UK, Australia, Canada, Brazil, India, Italy.

Each product should have:
- id: "claude-[unique-id]"
- name: realistic product name
- brand: realistic brand name
- price: number between 5 and 200
- description: detailed description
- country: country of origin
- category: skincare, makeup, haircare, fragrance, or beauty

Return ONLY a valid JSON array, no other text:
[{"id":"claude-1","name":"...","brand":"...","price":25.99,"description":"...","country":"USA","category":"skincare"}]`
      }]
    });
    
    const responseText = response.content[0].text || '[]';
    
    // Extract JSON from response
    let jsonData = responseText;
    
    // Remove markdown code blocks if present
    jsonData = jsonData.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find array in the text
    const arrayMatch = jsonData.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonData = arrayMatch[0];
    }
    
    const products = JSON.parse(jsonData);
    console.log(`🤖 Claude generated ${products.length} products`);
    
    return products.map((product, index) => ({
      id: product.id || `claude-${query}-${index}`,
      name: product.name || `Beauty Product ${index + 1}`,
      brand: product.brand || 'Premium Beauty',
      price: Number(product.price) || (Math.random() * 100 + 15),
      description: product.description || `High-quality beauty product for ${query}`,
      country: product.country || 'Global',
      category: product.category || 'beauty'
    }));
    
  } catch (error) {
    console.error('🤖 Claude API error:', error.message);
    return [];
  }
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Beauty AI Backend - No Limits Edition',
    endpoints: ['/health', '/api/products/search', '/api/chat/claude'],
    totalProducts: BEAUTY_PRODUCTS.length
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    productsCount: BEAUTY_PRODUCTS.length,
    timestamp: new Date().toISOString(),
    version: 'no-limits'
  });
});

// SEARCH ENDPOINT - ABSOLUTELY NO LIMITS
app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase().trim() : 'global';
  const requestId = req.headers['x-request-id'] || Math.random().toString(36);
  
  console.log(`\n🔍 SEARCH START - Query: "${query}", ID: ${requestId}`);
  
  try {
    let allProducts = [];
    let apiSources = [];

    // Run both APIs in parallel
    const apiPromises = [];

    if (process.env.RAINFOREST_API_KEY && query !== 'global') {
      apiPromises.push(
        searchRainforest(query)
          .then(products => ({ source: 'rainforest', products }))
          .catch(error => ({ source: 'rainforest', products: [], error: error.message }))
      );
    }

    if (process.env.ANTHROPIC_API_KEY && query !== 'global') {
      apiPromises.push(
        queryClaude(query, 'beauty products')
          .then(products => ({ source: 'claude', products }))
          .catch(error => ({ source: 'claude', products: [], error: error.message }))
      );
    }

    // Execute APIs in parallel
    if (apiPromises.length > 0) {
      console.log(`🚀 Launching ${apiPromises.length} API calls in parallel...`);
      const results = await Promise.all(apiPromises);
      
      results.forEach(result => {
        if (result.products.length > 0) {
          allProducts.push(...result.products);
          apiSources.push(result.source);
          console.log(`✅ ${result.source}: ${result.products.length} products`);
        } else if (result.error) {
          console.log(`❌ ${result.source}: ${result.error}`);
        }
      });
    }

    // ALWAYS add local products (no limits)
    console.log(`📚 Adding local products for "${query}"...`);
    
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

    // Remove duplicates by name (case-insensitive)
    const uniqueProducts = [];
    const seenNames = new Set();
    
    allProducts.forEach(product => {
      const key = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueProducts.push(product);
      }
    });

    // Shuffle for variety
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    const sourceString = apiSources.join('+');
    
    console.log(`🎉 FINAL RESULT: ${uniqueProducts.length} unique products from [${sourceString}]`);
    console.log(`🔍 SEARCH COMPLETE - ID: ${requestId}\n`);
    
    // CRITICAL: Return ALL products with NO limits
    res.json({
      success: true,
      products: uniqueProducts, // ← NO .slice() or limits here!
      stats: {
        productCount: uniqueProducts.length,
        source: sourceString,
        totalBeforeDedup: allProducts.length,
        rainforestCount: allProducts.filter(p => p.id?.includes('rainforest')).length,
        claudeCount: allProducts.filter(p => p.id?.includes('claude')).length,
        localCount: localProducts.length,
        requestId: requestId
      }
    });
    
  } catch (error) {
    console.error(`❌ Search error for "${query}":`, error.message);
    res.status(500).json({
      success: false,
      products: [],
      error: error.message,
      stats: { productCount: 0, source: 'error' }
    });
  }
});

// CHAT ENDPOINT - ALSO NO LIMITS
app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body || {};
  const requestId = req.headers['x-request-id'] || Math.random().toString(36);
  
  console.log(`\n💬 CHAT START - Message: "${message}", ID: ${requestId}`);
  
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

    if (process.env.ANTHROPIC_API_KEY) {
      promises.push(
        queryClaude(searchQuery, context || 'beauty')
          .then(products => ({ source: 'claude', products }))
          .catch(() => ({ source: 'claude', products: [] }))
      );
    }

    const results = await Promise.all(promises);
    results.forEach(result => {
      if (result.products.length > 0) {
        allProducts.push(...result.products);
        sources.push(result.source);
        console.log(`💬 ${result.source}: ${result.products.length} products`);
      }
    });

    // Add local products
    const searchTerms = searchQuery.split(' ').filter(t => t.length > 2);
    const localProducts = BEAUTY_PRODUCTS.filter(product => {
      return searchTerms.some(term =>
        product.name?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
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

    // Shuffle
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    console.log(`💬 CHAT RESULT: ${uniqueProducts.length} products from [${sources.join('+')}]`);
    
    // Return ALL products - NO LIMITS
    res.json({
      success: true,
      products: uniqueProducts, // ← NO limits!
      stats: {
        productCount: uniqueProducts.length,
        source: sources.join('+'),
        requestId: requestId
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
  console.log(`\n🚀 Beauty AI Backend (No Limits) running on port ${port}`);
  console.log(`📊 ${BEAUTY_PRODUCTS.length} local products loaded`);
  console.log(`🌧️ Rainforest API: ${process.env.RAINFOREST_API_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🤖 Claude API: ${process.env.ANTHROPIC_API_KEY ? 'ENABLED' : 'DISABLED'}\n`);
});
