// ✅ Ensure JSON parsing is enabled (should already be near the top of your server.js)
app.use(express.json());

// ✅ Sample static dataset for anti-aging products (replace later with dynamic or full set)
const sampleProducts = [
  {
    id: 'anti1',
    name: 'Retinol Night Cream',
    brand: 'GlowSkin',
    price: '$24.99',
    description: 'Visibly reduces wrinkles and fine lines.',
    category: 'antiaging',
    country: 'USA'
  },
  {
    id: 'anti2',
    name: 'Vitamin C Serum',
    brand: 'LumiCare',
    price: '$18.50',
    description: 'Brightens skin and improves elasticity.',
    category: 'antiaging',
    country: 'South Korea'
  },
  {
    id: 'anti3',
    name: 'Scar Fade Gel',
    brand: 'RenewIt',
    price: '$12.99',
    description: 'Smooths out post-acne and surgical scars.',
    category: 'antiaging',
    country: 'France'
  }
];

// ✅ Add new route for product search
app.post('/api/products/search', (req, res) => {
  const { query = '', limit = 50 } = req.body;

  const filtered = sampleProducts.filter(p =>
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  return res.json({
    success: true,
    products: filtered.slice(0, limit)
  });
});

