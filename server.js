const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Import product datasets
let globalProducts, enrichedTanningEyelashesLip;
try {
  globalProducts = require('./data/globalProducts').globalProducts;
  enrichedTanningEyelashesLip = require('./data/enrichedTanningEyelashesLip');
  console.log('Successfully imported product datasets');
} catch (error) {
  console.error('Error importing product datasets:', error.message);
  globalProducts = [];
  enrichedTanningEyelashesLip = [];
}

// Merge product datasets
const BEAUTY_PRODUCTS = [
  ...globalProducts,
  ...enrichedTanningEyelashesLip,
];
console.log(`BEAUTY_PRODUCTS length: ${BEAUTY_PRODUCTS.length}`);

app.use(cors({
  origin: 'https://beauty-static-live.onrender.com',
}));
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Luminous AI Backend is running. Use /api/products/search or /api/chat/claude.' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', productsCount: BEAUTY_PRODUCTS.length });
});

// Recalled products
const RECALLED_PRODUCTS = [
  { name: 'Artificial Tears Ophthalmic Solution', ndc: '50268-043-15' },
  { name: 'Carboxymethylcellulose Sodium Ophthalmic Gel 1%', ndc: '50268-066-15' },
  { name: 'Carboxymethylcellulose Sodium Ophthalmic Solution', ndc: '50268-068-15' },
];

app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  console.log(`Processing search query: ${query}`);
  let products = [];

  // Step 1: Rainforest API
  if (process.env.RAINFOREST_API_KEY) {
    try {
      const response = await axios.get('https://api.rainforestapi.com/request', {
        params: {
          api_key: process.env.RAINFOREST_API_KEY,
          type: 'search',
          amazon_domain: 'amazon.com',
          search_term: query + ' beauty products',
        },
        timeout: 10000,
      });
      console.log('Rainforest API response:', response.data.search_results?.length || 0);
      products = (response.data.search_results || [])
        .map(item => ({
          name: item.title,
          brand: item.brand || 'Unknown',
          price: item.price ? parseFloat(item.price.value) : 0,
          category: query.includes('eye') ? 'Eye Care' :
                   query.includes('tanning') ? 'Tanning' :
                   query.includes('eyelash') ? 'Eyelashes' :
                   query.includes('lip') ? 'Lip Products' :
                   query.includes('k-beauty') ? 'Skincare' :
                   query.includes('anti-aging') ? 'Anti-Aging' : 'Other',
          description: item.description || 'No description available',
          country: 'Unknown',
        }))
        .filter(product => !RECALLED_PRODUCTS.some(recalled => recalled.name === product.name || product.name.includes('Artificial Tears')));
    } catch (error) {
      console.error('Rainforest API error:', error.message);
    }
  } else {
    console.warn('RAINFOREST_API_KEY not set');
  }

  // Step 2: Makeup API
  if (products.length === 0 && (query.includes('lip') || query.includes('eyelash'))) {
    try {
      const makeupType = query.includes('lip') ? 'lipstick' : 'eyelash';
      const response = await axios.get(`http://makeup-api.herokuapp.com/api/v1/products.json?product_type=${makeupType}`, {
        timeout: 10000,
      });
      console.log('Makeup API response:', response.data.length);
      products = response.data
        .map(item => ({
          name: item.name,
          brand: item.brand || 'Unknown',
          price: item.price ? parseFloat(item.price) : 0,
          category: query.includes('lip') ? 'Lip Products' : 'Eyelashes',
          description: item.description || 'No description available',
          country: 'Unknown',
        }))
        .filter(product => !RECALLED_PRODUCTS.some(recalled => recalled.name === product.name));
    } catch (error) {
      console.error('Makeup API error:', error.message);
    }
  }

  // Step 3: Local database
  if (products.length === 0) {
    console.log('Using local BEAUTY_PRODUCTS for query:', query);
    products = BEAUTY_PRODUCTS.filter(product =>
      (product.category.toLowerCase().includes(query) ||
       product.name.toLowerCase().includes(query) ||
       product.brand.toLowerCase().includes(query) ||
       product.description.toLowerCase().includes(query) ||
       product.country.toLowerCase().includes(query)) &&
      !RECALLED_PRODUCTS.some(recalled => recalled.name === product.name)
    );
  }

  // Step 4: Stats
  const brands = [...new Set(products.map(p => p.brand))];
  const countries = [...new Set(products.map(p => p.country).filter(c => c !== 'Unknown'))];

  console.log(`Returning ${products.length} products for query: ${query}`);
  res.json({
    products,
    stats: {
      productCount: products.length,
      brandCount: brands.length,
      countryCount: countries.length,
    },
  });
});

// Chat endpoint for Claude-like responses
app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body;
  console.log(`Chat query: ${message}, Context: ${context}`);
  let responseText = '';

  try {
    // Step 1: Check if message is a product query
    const query = message.toLowerCase();
    let products = [];

    // Try Rainforest API
    if (process.env.RAINFOREST_API_KEY && (context.includes('Amazon Finds') || query.includes('product'))) {
      try {
        const response = await axios.get('https://api.rainforestapi.com/request', {
          params: {
            api_key: process.env.RAINFOREST_API_KEY,
            type: 'search',
            amazon_domain: 'amazon.com',
            search_term: query + ' beauty products',
          },
          timeout: 10000,
        });
        products = (response.data.search_results || [])
          .map(item => ({
            name: item.title,
            brand: item.brand || 'Unknown',
            price: item.price ? parseFloat(item.price.value) : 0,
            description: item.description || 'No description available',
          }))
          .slice(0, 3); // Limit to 3 products
      } catch (error) {
        console.error('Rainforest API error in chat:', error.message);
      }
    }

    // Try Makeup API for lip/eyelash
    if (products.length === 0 && (query.includes('lip') || query.includes('eyelash'))) {
      try {
        const makeupType = query.includes('lip') ? 'lipstick' : 'eyelash';
        const response = await axios.get(`http://makeup-api.herokuapp.com/api/v1/products.json?product_type=${makeupType}`, {
          timeout: 10000,
        });
        products = response.data
          .map(item => ({
            name: item.name,
            brand: item.brand || 'Unknown',
            price: item.price ? parseFloat(item.price) : 0,
            description: item.description || 'No description available',
          }))
          .slice(0, 3);
      } catch (error) {
        console.error('Makeup API error in chat:', error.message);
      }
    }

    // Local database
    if (products.length === 0) {
      products = BEAUTY_PRODUCTS
        .filter(product =>
          product.category.toLowerCase().includes(query) ||
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.country.toLowerCase().includes(query)
        )
        .slice(0, 3);
    }

    // Step 2: Generate response based on context
    if (products.length > 0) {
      responseText = `Here are some ${context} products matching "${message}":\n` +
        products.map(p => `- ${p.name} by ${p.brand} ($${p.price.toFixed(2)}): ${p.description}`).join('\n');
    } else if (context.includes('Instagram Trends')) {
      responseText = `Popular ${context} include multi-step K-Beauty routines, glass skin looks, and sustainable products. Try searching for K-Beauty or natural beauty products!`;
    } else if (context.includes('K-Beauty')) {
      responseText = `K-Beauty is known for innovative skincare like snail mucin and sheet masks. Popular brands include COSRX, Laneige, and Sulwhasoo. Want specific product recommendations?`;
    } else if (context.includes('Natural Beauty')) {
      responseText = `Natural beauty focuses on clean, eco-friendly products. Brands like Herbivore and Drunk Elephant are trending. Shall I find some for you?`;
    } else if (context.includes('Luxury Skincare')) {
      responseText = `Luxury skincare features brands like La Mer and SK-II. Their serums and creams are top-tier for anti-aging. Want me to search for specifics?`;
    } else {
      responseText = `I'm here to help with beauty advice! For "${message}", try selecting a topic like K-Beauty or Amazon Finds, or ask for specific products.`;
    }

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process chat request' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'demo@beauty.com' && password === 'demo123') {
    res.json({ token: 'demo-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  res.json({ token: 'new-user-token' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
