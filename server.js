const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Import product datasets
let globalProducts = [];
let enrichedTanningEyelashesLip = [];
try {
  globalProducts = require('./data/globalProducts').globalProducts || [];
  enrichedTanningEyelashesLip = require('./data/enrichedTanningEyelashesLip') || [];
  console.log('Successfully imported product datasets');
} catch (error) {
  console.error('Error importing product datasets:', error.message);
}

// Merge and filter datasets
const BEAUTY_PRODUCTS = [
  ...globalProducts,
  ...enrichedTanningEyelashesLip,
].filter(p => p && p.name && p.category && p.brand && p.price && p.description);
console.log(`BEAUTY_PRODUCTS length: ${BEAUTY_PRODUCTS.length}`);

app.use(cors({
  origin: 'https://beauty-static-live.onrender.com',
}));
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Beauty AI Backend running. Use /api/products/search or /api/chat/claude.' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    productsCount: BEAUTY_PRODUCTS.length,
    timestamp: new Date().toISOString()
  });
});

// Recalled products
const RECALLED_PRODUCTS = [
  { name: 'Artificial Tears Ophthalmic Solution', ndc: '50268-043-15' },
  { name: 'Carboxymethylcellulose Sodium Ophthalmic Gel 1%', ndc: '50268-066-15' },
  { name: 'Carboxymethylcellulose Sodium Ophthalmic Solution', ndc: '50268-068-15' },
];

app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  console.log(`Search query: ${query}`);
  let products = [];

  try {
    products = BEAUTY_PRODUCTS.filter(product =>
      product && (
        product.category?.toLowerCase().includes(query) ||
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.country?.toLowerCase().includes(query)
      ) && !RECALLED_PRODUCTS.some(recalled => recalled.name === product.name)
    );

    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const countries = [...new Set(products.map(p => p.country).filter(Boolean))];

    console.log(`Returning ${products.length} products for query: ${query}`);
    res.json({
      success: true,
      products: products || [],
      stats: {
        productCount: products.length,
        brandCount: brands.length,
        countryCount: countries.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.json({
      success: false,
      error: 'Failed to process search',
      products: [],
      stats: { productCount: 0, brandCount: 0, countryCount: 0 },
    });
  }
});

app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body || {};
  console.log(`Chat query: ${message}, Context: ${context}`);

  if (!message || !context) {
    return res.status(400).json({ success: false, error: 'Missing message or context' });
  }

  try {
    const query = message.toLowerCase();
    let products = BEAUTY_PRODUCTS
      .filter(product =>
        product && (
          product.category?.toLowerCase().includes(query) ||
          product.name?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.country?.toLowerCase().includes(query)
        )
      )
      .slice(0, 3);

    let responseText = products.length > 0 ?
      `Here are some ${context} products matching "${message}":\n` +
      products.map(p => `- ${p.name} by ${p.brand} ($${Number(p.price || 0).toFixed(2)}): ${p.description}`).join('\n') :
      `No products found for "${message}". Try a topic like K-Beauty or ask for specific products.`;

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.json({ success: false, error: 'Failed to process chat request' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  if (email === 'demo@beauty.com' && password === 'demo123') {
    res.json({ token: 'demo-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }
  res.json({ token: 'new-user-token' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
