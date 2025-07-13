const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Dataset with ~3100 products (same as before)
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

// Rainforest API search (simplified for now)
async function searchRainforest(query) {
  if (!process.env.RAINFOREST_API_KEY) {
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
        category_id: 'beauty'
      },
      timeout: 8000
    });
    
    if (response.data.search_results) {
      const products = response.data.search_results.slice(0, 50).map((item, index) => ({
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

// ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beauty AI Backend - Pagination Fixed',
    endpoints: ['/health', '/api/products/search', '/debug/keys', '/test/stats'],
    totalProducts: BEAUTY_PRODUCTS.length,
    version: '2.2-pagination'
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
    timestamp: new Date().toISOString()
  });
});

// TEST: STATS ONLY (no massive product array)
app.get('/test/stats', (req, res) => {
  console.log(`📊 Returning stats for ${BEAUTY_PRODUCTS.length} products`);
  
  res.json({
    success: true,
    totalProducts: BEAUTY_PRODUCTS.length,
    categories: categoryCounts,
    sampleProducts: BEAUTY_PRODUCTS.slice(0, 5), // Just 5 samples
    message: "Stats returned without full product list to avoid size limits"
  });
});

// MAIN SEARCH ENDPOINT WITH PAGINATION
app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase().trim() : 'global';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 500; // Default 500 per page
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).slice(2);
  
  console.log(`\n🔍 SEARCH - Query: "${query}", Page: ${page}, Limit: ${limit}, ID: ${requestId}`);
  
  try {
    let allProducts = [];
    let apiSources = [];

    // Get API products (limited to avoid size issues)
    if (process.env.RAINFOREST_API_KEY && query !== 'global') {
      try {
        const rainforestProducts = await searchRainforest(query);
        if (rainforestProducts.length > 0) {
          allProducts.push(...rainforestProducts);
          apiSources.push('rainforest');
          console.log(`✅ Rainforest: ${rainforestProducts.length} products`);
        }
      } catch (error) {
        console.log(`❌ Rainforest failed: ${error.message}`);
      }
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

    // Shuffle for variety
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    // PAGINATION: Calculate what to return
    const totalProducts = uniqueProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = uniqueProducts.slice(startIndex, endIndex);

    const sourceString = apiSources.join('+');
    
    console.log(`🎉 PAGINATION: Page ${page}/${totalPages}, returning ${paginatedProducts.length} of ${totalProducts} total`);
    
    // Return paginated results
    res.json({
      success: true,
      products: paginatedProducts, // Only current page
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        productsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null
      },
      stats: {
        productCount: paginatedProducts.length,
        totalAvailable: totalProducts,
        source: sourceString,
        rainforestCount: allProducts.filter(p => p.id?.includes('rainforest')).length,
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

// SIMPLE CHAT ENDPOINT
app.post('/api/chat/claude', async (req, res) => {
  const { message } = req.body || {};
  
  if (!message) {
    return res.status(400).json({ 
      success: false, 
      products: [], 
      error: 'Message is required' 
    });
  }
  
  try {
    // For now, just redirect to search with pagination
    const searchQuery = message.toLowerCase().trim();
    
    // Simple local search with limit
    const searchTerms = searchQuery.split(' ').filter(t => t.length > 2);
    const matchingProducts = BEAUTY_PRODUCTS.filter(product => {
      return searchTerms.some(term =>
        product.name?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term)
      ) || searchQuery === 'global';
    }).slice(0, 500); // Limit to 500 to avoid size issues

    res.json({
      success: true,
      products: matchingProducts,
      stats: {
        productCount: matchingProducts.length,
        source: 'local-chat',
        message: 'Chat endpoint with size limits to avoid response issues'
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
  console.log(`\n🚀 Beauty AI Backend (Pagination Fixed) running on port ${port}`);
  console.log(`📊 ${BEAUTY_PRODUCTS.length} local products loaded`);
  console.log(`🌧️ Rainforest API: ${process.env.RAINFOREST_API_KEY ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  console.log(`💎 Gemini API: ${process.env.GEMINI_API_KEY ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  console.log(`📄 Pagination: Default 500 products per page to avoid response size limits`);
  console.log(`🔗 Use ?page=2&limit=500 for more products\n`);
});
