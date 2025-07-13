const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const app = express();
const port = process.env.PORT || 3000;

// Dataset with ~3100 products (keeping your existing dataset)
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

// UPDATED CORS - Allow more origins including localhost and file:// 
app.use(cors({
  origin: [
    'https://beauty-static-live.onrender.com', 
    'https://beautystatic.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500', // Live Server default
    'null' // For file:// URLs
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Request-ID']
}));

app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ENHANCED Rainforest API search - try multiple searches for more results
async function searchRainforest(query) {
  try {
    const searchTerms = [query];
    
    // Add related search terms for broader results
    if (query.includes('beauty') || query === 'global') {
      searchTerms.push('skincare', 'makeup', 'cosmetics', 'beauty products');
    }
    if (query.includes('k-beauty')) {
      searchTerms.push('korean skincare', 'k beauty', 'korean cosmetics');
    }
    if (query.includes('anti-aging')) {
      searchTerms.push('anti aging cream', 'wrinkle cream', 'retinol');
    }
    
    let allProducts = [];
    
    // Search with multiple terms to get more results
    for (const term of searchTerms.slice(0, 3)) { // Limit to 3 searches to avoid rate limits
      try {
        console.log(`Searching Rainforest for: ${term}`);
        const response = await axios.get('https://api.rainforestapi.com/request', {
          params: {
            api_key: process.env.RAINFOREST_API_KEY,
            type: 'search',
            amazon_domain: 'amazon.com',
            search_term: term,
            category_id: 'beauty',
            max_page: 3 // Get more pages for more products
          },
          timeout: 8000
        });
        
        if (response.data.search_results) {
          const products = response.data.search_results.map(item => ({
            id: item.asin || `rainforest-${Math.random().toString(36).slice(2)}`,
            name: item.title || 'Unknown Product',
            brand: item.brand || 'Unknown Brand',
            price: parseFloat(item.price?.value || (Math.random() * 50 + 10)),
            description: item.description || item.title || 'High-quality beauty product',
            country: 'USA',
            category: 'beauty'
          }));
          
          allProducts.push(...products);
          console.log(`Found ${products.length} products for term: ${term}`);
        }
      } catch (termError) {
        console.error(`Rainforest search failed for term "${term}":`, termError.message);
      }
    }
    
    // Remove duplicates by ID
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );
    
    console.log(`Total unique Rainforest products: ${uniqueProducts.length}`);
    return uniqueProducts;
    
  } catch (error) {
    console.error('Rainforest API error:', error.message);
    return [];
  }
}

// Query Claude - Enhanced to generate more diverse products
async function queryClaude(query, context) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000, // Increased for more products
      messages: [{
        role: 'user',
        content: `Create a diverse list of 20-50 beauty products related to "${query}" in the context of ${context}. 

Include products from different countries (USA, South Korea, Japan, France, Germany, UK, Australia, Brazil, etc.) and various price ranges ($5-$200).

For each product, provide:
- Unique product name
- Brand name  
- Realistic price (number only, no currency symbol)
- Detailed description
- Country of origin
- Category (skincare, makeup, haircare, etc.)
- Unique ID starting with "claude-"

Format as a JSON array of objects with these exact fields: id, name, brand, price, description, country, category.

Focus on real-sounding products that would actually exist for the search term "${query}".`
      }]
    });
    
    const responseText = response.content[0].text || '[]';
    console.log('Claude raw response length:', responseText.length);
    
    // Try to extract JSON from the response
    let jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      // Try to find JSON with brackets
      jsonMatch = responseText.match(/```json\s*(\[.*\])\s*```/s);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]];
      }
    }
    
    if (jsonMatch) {
      const products = JSON.parse(jsonMatch[0]);
      console.log(`Claude generated ${products.length} products`);
      
      // Ensure all products have claude- prefix and proper structure
      return products.map((product, index) => ({
        id: product.id || `claude-${query}-${index + 1}`,
        name: product.name || `Beauty Product ${index + 1}`,
        brand: product.brand || 'Premium Beauty',
        price: Number(product.price) || (Math.random() * 100 + 10),
        description: product.description || `High-quality beauty product for ${query}`,
        country: product.country || 'Global',
        category: product.category || 'beauty'
      })).filter(p => p.name && p.brand); // Filter out incomplete products
    }
    
    console.log('Claude: Could not parse JSON from response');
    return [];
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

// UPDATED SEARCH ENDPOINT - Use both APIs simultaneously for maximum coverage
app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase().replace(/[^a-z0-9\s-]/g, '') : '';
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.log(`Search query: "${query}", requestID: ${requestId}`);
  
  try {
    let allProducts = [];
    let sources = [];

    // PARALLEL EXECUTION - Run both APIs simultaneously for speed
    const apiPromises = [];

    // Add Rainforest API promise
    if (process.env.RAINFOREST_API_KEY && query && query !== '') {
      console.log('Launching Rainforest API search...');
      apiPromises.push(
        searchRainforest(query)
          .then(products => ({ source: 'rainforest', products }))
          .catch(error => {
            console.error('Rainforest failed:', error.message);
            return { source: 'rainforest', products: [] };
          })
      );
    }

    // Add Claude API promise
    if (process.env.ANTHROPIC_API_KEY && query && query !== '') {
      console.log('Launching Claude API search...');
      apiPromises.push(
        queryClaude(query, 'beauty products worldwide')
          .then(products => ({ source: 'claude', products }))
          .catch(error => {
            console.error('Claude failed:', error.message);
            return { source: 'claude', products: [] };
          })
      );
    }

    // Execute both APIs in parallel
    if (apiPromises.length > 0) {
      const apiResults = await Promise.all(apiPromises);
      
      apiResults.forEach(result => {
        if (result.products.length > 0) {
          allProducts.push(...result.products);
          sources.push(result.source);
          console.log(`✅ ${result.source} returned ${result.products.length} products`);
        }
      });
    }

    // Always supplement with local products for comprehensive coverage
    console.log('Adding local products for comprehensive coverage...');
    let categoriesToMatch = [query];
    if (QUERY_ALIASES[query]) {
      categoriesToMatch = QUERY_ALIASES[query];
    }
    
    const localProducts = BEAUTY_PRODUCTS.filter(product =>
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
    
    allProducts.push(...localProducts);
    sources.push('local');
    console.log(`Added ${localProducts.length} local products`);

    // Remove duplicates by name similarity (case-insensitive)
    const uniqueProducts = [];
    const seenNames = new Set();
    
    allProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueProducts.push(product);
      }
    });

    // Shuffle products for variety (mix API results with local)
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    const finalSource = sources.length > 1 ? sources.join('+') : sources[0] || 'local';
    
    console.log(`Returning ${uniqueProducts.length} total unique products for query: "${query}", sources: ${finalSource}`);
    
    // Return ALL products found - no limits
    res.json({
      success: true,
      products: uniqueProducts,
      stats: {
        productCount: uniqueProducts.length,
        source: finalSource,
        rainforestCount: allProducts.filter(p => p.country === 'USA' && !p.id.includes('antiaging')).length,
        claudeCount: allProducts.filter(p => p.id && p.id.includes('claude')).length,
        localCount: localProducts.length,
        sourceBreakdown: sources
      }
    });
  } catch (error) {
    console.error(`Search error: ${error.message}, requestID: ${requestId}`);
    res.status(500).json({
      success: false,
      products: [],
      stats: { productCount: 0, source: 'error' }
    });
  }
});

// UPDATED CHAT ENDPOINT - Use both APIs simultaneously
app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body || {};
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.log(`Chat query: "${message}", Context: ${context}, requestID: ${requestId}`);
  
  if (!message || !context) {
    return res.status(400).json({ success: false, products: [], error: 'Missing message or context' });
  }
  
  try {
    const timeout = setTimeout(() => {
      console.error(`Chat request timeout for query: ${message}, requestID: ${requestId}`);
      res.status(503).json({ success: false, products: [], error: 'Request timeout' });
    }, 20000); // Increased timeout for parallel API calls

    let allProducts = [];
    let sources = [];
    let searchQuery = message.toLowerCase().replace(/[^a-z0-9\s-]/g, '');

    // PARALLEL EXECUTION - Run both APIs simultaneously
    const apiPromises = [];

    // Add Rainforest API promise
    if (process.env.RAINFOREST_API_KEY && searchQuery) {
      console.log('Chat: Launching Rainforest API search...');
      apiPromises.push(
        searchRainforest(searchQuery)
          .then(products => ({ source: 'rainforest', products }))
          .catch(error => {
            console.error('Chat Rainforest failed:', error.message);
            return { source: 'rainforest', products: [] };
          })
      );
    }

    // Add Claude API promise
    if (process.env.ANTHROPIC_API_KEY && searchQuery) {
      console.log('Chat: Launching Claude API search...');
      apiPromises.push(
        queryClaude(searchQuery, context)
          .then(products => ({ source: 'claude', products }))
          .catch(error => {
            console.error('Chat Claude failed:', error.message);
            return { source: 'claude', products: [] };
          })
      );
    }

    // Execute both APIs in parallel
    if (apiPromises.length > 0) {
      const apiResults = await Promise.all(apiPromises);
      
      apiResults.forEach(result => {
        if (result.products.length > 0) {
          allProducts.push(...result.products);
          sources.push(result.source);
          console.log(`✅ Chat ${result.source} returned ${result.products.length} products`);
        }
      });
    }

    // Always add local products for comprehensive coverage
    console.log('Chat: Adding local products...');
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
    
    const localProducts = BEAUTY_PRODUCTS.filter(product =>
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
    
    allProducts.push(...localProducts);
    sources.push('local');
    console.log(`Chat: Added ${localProducts.length} local products`);

    // Remove duplicates by name similarity
    const uniqueProducts = [];
    const seenNames = new Set();
    
    allProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueProducts.push(product);
      }
    });

    // Shuffle for variety
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    const finalSource = sources.length > 1 ? sources.join('+') : sources[0] || 'local';

    clearTimeout(timeout);
    console.log(`Chat: Returning ${uniqueProducts.length} products for query: "${message}", sources: ${finalSource}`);
    
    // Return ALL products - no limits
    res.json({
      success: true,
      products: uniqueProducts,
      stats: {
        productCount: uniqueProducts.length,
        source: finalSource,
        sourceBreakdown: sources
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
