const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Robust dataset with ~3100 products
const BEAUTY_PRODUCTS = [
  // Anti-Aging (600 products)
  ...Array.from({ length: 600 }, (_, i) => ({
    name: `Anti Aging Serum ${i + 1}`,
    category: "anti-aging",
    brand: `AgeDefy${Math.floor(i / 50) + 1}`,
    price: 20 + Math.random() * 100, // Store as number
    description: `Reduces wrinkles and boosts firmness, #${i + 1}.`,
    country: ["USA", "France", "Japan", "South Korea"][Math.floor(Math.random() * 4)],
    id: `antiaging-${i + 1}`
  })),
  // K-Beauty (600 products)
  ...Array.from({ length: 600 }, (_, i) => ({
    name: `K Beauty Essence ${i + 1}`,
    category: "k-beauty",
    brand: `KBeauty${Math.floor(i / 50) + 1}`,
    price: 10 + Math.random() * 60,
    description: `Hydrating essence for radiant skin, #${i + 1}.`,
    country: "South Korea",
    id: `kbeauty-${i + 1}`
  })),
  // Eye Care (500 products)
  ...Array.from({ length: 500 }, (_, i) => ({
    name: `Eye Cream ${i + 1}`,
    category: "eye care",
    brand: `EyeCare${Math.floor(i / 50) + 1}`,
    price: 15 + Math.random() * 70,
    description: `Reduces puffiness and dark circles, #${i + 1}.`,
    country: ["USA", "UK", "Germany"][Math.floor(Math.random() * 3)],
    id: `eyecare-${i + 1}`
  })),
  // Tanning (400 products)
  ...Array.from({ length: 400 }, (_, i) => ({
    name: `Tanning Lotion ${i + 1}`,
    category: "tanning",
    brand: `TanGlow${Math.floor(i / 50) + 1}`,
    price: 12 + Math.random() * 50,
    description: `Natural glow tanning lotion, #${i + 1}.`,
    country: ["Australia", "USA"][Math.floor(Math.random() * 2)],
    id: `tanning-${i + 1}`
  })),
  // Eyelashes (400 products)
  ...Array.from({ length: 400 }, (_, i) => ({
    name: `Eyelash Serum ${i + 1}`,
    category: "eyelashes",
    brand: `LashBoost${Math.floor(i / 50) + 1}`,
    price: 25 + Math.random() * 80,
    description: `Enhances lash growth, #${i + 1}.`,
    country: ["USA", "France"][Math.floor(Math.random() * 2)],
    id: `eyelashes-${i + 1}`
  })),
  // Lip Products (400 products)
  ...Array.from({ length: 400 }, (_, i) => ({
    name: `Lip Gloss ${i + 1}`,
    category: "lip products",
    brand: `LipShine${Math.floor(i / 50) + 1}`,
    price: 5 + Math.random() * 25,
    description: `Hydrating and glossy lip product, #${i + 1}.`,
    country: ["USA", "Canada"][Math.floor(Math.random() * 2)],
    id: `lipproducts-${i + 1}`
  })),
  // Global (200 products)
  ...Array.from({ length: 200 }, (_, i) => ({
    name: `Global Beauty Product ${i + 1}`,
    category: "global",
    brand: `WorldBeauty${Math.floor(i / 20) + 1}`,
    price: 10 + Math.random() * 120,
    description: `Unique beauty product from global trends, #${i + 1}.`,
    country: ["Brazil", "India", "Italy", "South Africa"][Math.floor(Math.random() * 4)],
    id: `global-${i + 1}`
  }))
].filter(p => p && p.name && p.category && p.brand && p.price && p.description && p.id);
console.log(`BEAUTY_PRODUCTS total: ${BEAUTY_PRODUCTS.length}`);

app.use(cors({
  origin: 'https://beauty-static-live.onrender.com',
}));
app.use(express.json());

// Root route to prevent 404s
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Luminous AI Backend',
    endpoints: ['/health', '/api/products/search', '/api/chat/claude']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    productsCount: BEAUTY_PRODUCTS.length,
    timestamp: new Date().toISOString()
  });
});

// Search endpoint
app.get('/api/products/search', (req, res) => {
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
      products: products.slice(0, 100).map(product => ({
        ...product,
        price: Number(product.price).toFixed(2) // Convert to string with 2 decimals for frontend
      })),
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
app.post('/api/chat/claude', (req, res) => {
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
