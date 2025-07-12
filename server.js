const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Robust dataset with thousands of products
const BEAUTY_PRODUCTS = [
  // Anti-Aging (500 products)
  ...Array.from({ length: 500 }, (_, i) => ({
    name: `Anti-Aging Cream ${i + 1}`,
    category: "anti-aging",
    brand: `Brand${Math.floor(i / 50) + 1}`,
    price: (20 + Math.random() * 80).toFixed(2),
    description: `Advanced anti-aging cream for wrinkles and firmness, #${i + 1}.`,
    country: ["USA", "France", "Japan", "South Korea"][Math.floor(Math.random() * 4)]
  })),
  // K-Beauty (500 products)
  ...Array.from({ length: 500 }, (_, i) => ({
    name: `K-Beauty Mask ${i + 1}`,
    category: "k-beauty",
    brand: `KBrand${Math.floor(i / 50) + 1}`,
    price: (10 + Math.random() * 50).toFixed(2),
    description: `Hydrating K-Beauty sheet mask, #${i + 1}.`,
    country: "South Korea"
  })),
  // Eye Care (500 products)
  ...Array.from({ length: 500 }, (_, i) => ({
    name: `Eye Cream ${i + 1}`,
    category: "eye care",
    brand: `EyeBrand${Math.floor(i / 50) + 1}`,
    price: (15 + Math.random() * 60).toFixed(2),
    description: `Reduces puffiness and dark circles, #${i + 1}.`,
    country: ["USA", "UK", "Germany"][Math.floor(Math.random() * 3)]
  })),
  // Tanning (300 products)
  ...Array.from({ length: 300 }, (_, i) => ({
    name: `Tanning Lotion ${i + 1}`,
    category: "tanning",
    brand: `TanBrand${Math.floor(i / 50) + 1}`,
    price: (12 + Math.random() * 40).toFixed(2),
    description: `Natural glow tanning lotion, #${i + 1}.`,
    country: ["Australia", "USA"][Math.floor(Math.random() * 2)]
  })),
  // Eyelashes (300 products)
  ...Array.from({ length: 300 }, (_, i) => ({
    name: `Eyelash Serum ${i + 1}`,
    category: "eyelashes",
    brand: `LashBrand${Math.floor(i / 50) + 1}`,
    price: (25 + Math.random() * 70).toFixed(2),
    description: `Enhances lash growth, #${i + 1}.`,
    country: ["USA", "France"][Math.floor(Math.random() * 2)]
  })),
  // Lip Products (300 products)
  ...Array.from({ length: 300 }, (_, i) => ({
    name: `Lip Balm ${i + 1}`,
    category: "lip products",
    brand: `LipBrand${Math.floor(i / 50) + 1}`,
    price: (5 + Math.random() * 20).toFixed(2),
    description: `Hydrating lip balm, #${i + 1}.`,
    country: ["USA", "Canada"][Math.floor(Math.random() * 2)]
  })),
  // Global (all products + extras)
  ...Array.from({ length: 100 }, (_, i) => ({
    name: `Global Product ${i + 1}`,
    category: "global",
    brand: `GlobalBrand${Math.floor(i / 20) + 1}`,
    price: (10 + Math.random() * 100).toFixed(2),
    description: `Unique global beauty product, #${i + 1}.`,
    country: ["Brazil", "India", "Italy"][Math.floor(Math.random() * 3)]
  }))
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
        query === '' ||
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
      products: products.slice(0, 100), // Limit to 100 for performance
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
          query === '' ||
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
      products.map(p => `- ${p.name} by ${p.brand} ($${Number(p.price).toFixed(2)}): ${p.description}`).join('\n') :
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
