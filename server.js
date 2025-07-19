import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const anthropic = new Anthropic(process.env.ANTHROPIC_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Beauty AI Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Beauty products search endpoint
app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category, priceRange, countryPreference, productType } = req.body;

    const prompt = `...`; // Your existing prompt here

    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    });

    const products = JSON.parse(claudeResponse.content[0].text);
    res.json(products);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch beauty products' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    suggestedEndpoints: [
      'POST /search-beauty-products',
      'GET /'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
