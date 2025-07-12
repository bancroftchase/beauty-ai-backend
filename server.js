const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Import global products and enriched tanning/eyelashes/lip products
const { globalProducts } = require('./globalProducts');
const enrichedTanningEyelashesLip = require('./enrichedTanningEyelashesLip'); // Assume this file exists

app.use(cors());
app.use(express.json());

// Merge product datasets
const BEAUTY_PRODUCTS = [
  ...globalProducts,
  ...enrichedTanningEyelashesLip,
];

// Recalled products (eye care only for now)
const RECALLED_PRODUCTS = [
  { name: 'Artificial Tears Ophthalmic Solution', ndc: '50268-043-15' },
  { name: 'Carboxymethylcellulose Sodium Ophthalmic Gel 1%', ndc: '50268-066-15' },
  { name: 'Carboxymethylcellulose Sodium Ophthalmic Solution', ndc: '50268-068-15' },
];

app.get('/api/products/search', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  let products = [];

  // Step 1: Try external API (Rainforest API for Amazon)
  try {
    const response = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: process.env.RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: query + ' beauty products',
      },
    });
    const apiProducts = response.data.search_results || [];
    products = apiProducts
      .map(item => ({
        name: item.title,
        brand: item.brand || 'Unknown',
        price: item.price ? parseFloat(item.price.value) : 0,
        category: query.includes('eye') ? 'Eye Care' :
                 query.includes('tanning') ? 'Tanning' :
                 query.includes('eyelash') ? 'Eyelashes' :
                 query.includes('lip') ? 'Lip Products' : 'Other',
        description: item.description || 'No description available',
        country: 'Unknown',
      }))
      .filter(product => !RECALLED_PRODUCTS.some(recalled => recalled.name === product.name || product.name.includes('Artificial Tears')));
  } catch (error) {
    console.error('External API error:', error.message);
  }

  // Step 2: Fallback to local database if no results or API fails
  if (products.length === 0) {
    products = BEAUTY_PRODUCTS.filter(product =>
      (product.category.toLowerCase().includes(query) ||
       product.name.toLowerCase().includes(query) ||
       product.brand.toLowerCase().includes(query) ||
       product.description.toLowerCase().includes(query) ||
       product.country.toLowerCase().includes(query)) &&
      !RECALLED_PRODUCTS.some(recalled => recalled.name === product.name)
    );
  }

  // Step 3: Calculate stats for display
  const brands = [...new Set(products.map(p => p.brand))];
  const countries = [...new Set(products.map(p => p.country).filter(c => c !== 'Unknown'))];

  res.json({
    products,
    stats: {
      productCount: products.length,
      brandCount: brands.length,
      countryCount: countries.length,
    },
  });
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
