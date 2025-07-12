const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Load datasets with fallbacks
let globalProducts = [];
let enrichedTanningEyelashesLip = [];
try {
  globalProducts = require('./data/globalProducts').globalProducts || [];
  enrichedTanningEyelashesLip = require('./data/enrichedTanningEyelashesLip') || [];
  console.log('Datasets loaded:', {
    globalProducts: globalProducts.length,
    enrichedTanningEyelashesLip: enrichedTanningEyelashesLip.length
  });
} catch (error) {
  console.error('Error loading datasets:', error.message);
}

// Merge and filter datasets
const BEAUTY_PRODUCTS = [
  ...globalProducts,
  ...enrichedTanningEyelashesLip,
].filter(p => p && p.name && p.category && p.brand && p.price && p.description);
console.log(`BEAUTY_PRODUCTS total: ${BEAUTY_PRODUCTS.length}`);

app.use(cors({
  origin: 'https://beauty-static-live.onrender.com',
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    productsCount: BEAUTY_PRODUCTS.length,
    timestamp: new Date().toISOString()
  });
});

// Search endpoint
app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  console.log(`Search query: ${query}`);

  try {
    const products = BEAUTY_PRODUCTS.filter(product =>
      product && (
        product.category?.toLowerCase().includes(query) ||
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.country?.toLowerCase().includes(query)
      )
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
    res.status(500).json({
      success: false,
      error: 'Failed to process search',
      products: [],
      stats: { productCount: 0, brandCount: 0, countryCount: 0 },
    });
  }
});

// Chat endpoint
app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body || {};
  console.log(`Chat query: ${message}, Context: ${context}`);

  if (!message || !context) {
    return res.status(400).json({ success: false, error: 'Missing message or context' });
  }

  try {
    const query = message.toLowerCase();
    const products = BEAUTY_PRODUCTS
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

    const responseText = products.length > 0 ?
      `Here are some ${context} products matching "${message}":\n` +
      products.map(p => `- ${p.name} by ${p.brand} ($${Number(p.price || 0).toFixed(2)}): ${p.description}`).join('\n') :
      `No products found for "${message}". Try a topic like K-Beauty or ask for specific products.`;

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process chat request' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
