const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.anthropic.com', 'https://beauty-static-live.onrender.com'],
        fontSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
app.use(cors({
  origin: 'https://beauty-static-live.onrender.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const BEAUTY_PRODUCTS = [
  { name: 'Vitamin C Serum', brand: 'The Ordinary', price: 6.70, category: 'Serum' },
  { name: 'Hyaluronic Acid', brand: 'The Ordinary', price: 6.80, category: 'Serum' },
  { name: 'Moisturizing Cream', brand: 'CeraVe', price: 15.99, category: 'Moisturizer' },
  { name: 'Snail Mucin Essence', brand: 'COSRX', price: 17.00, category: 'Essence' },
  { name: 'Retinol Serum', brand: 'Paula’s Choice', price: 42.00, category: 'Serum' },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Beauty AI Backend is running' });
});

app.get('/api/products/search', (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  const filteredProducts = BEAUTY_PRODUCTS.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
  );
  res.json({ success: true, products: filteredProducts });
});

app.post('/api/chat/claude', async (req, res) => {
  const { message, context } = req.body;

  if (!process.env.CLAUDE_API_KEY) {
    return res.status(500).json({ success: false, error: 'Claude API key not configured' });
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: `You are a beauty expert. Provide a detailed response to the following user query in the context of ${context || 'beauty consultation'}: ${message}` }],
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const reply = response.data.content[0].text;
    res.json({ success: true, response: reply });
  } catch (error) {
    console.error('Error communicating with Claude API:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process the request' });
  }
});

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
