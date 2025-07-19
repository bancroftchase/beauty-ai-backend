import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Must be set in Render environment
});

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Handle preflight requests
app.options('/search-beauty-products', cors());

app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Category parameter is required" });
    }

    const prompt = `Provide 10 beauty products about ${category} in JSON format: [{
      "name": "Product Name",
      "price": "$XX",
      "description": "Brief description",
      "country": "Origin country"
    }]`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    });

    try {
      const products = JSON.parse(response.content[0].text);
      res.json(products);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      res.status(500).json({ error: "Failed to parse products" });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: "Failed to fetch products",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
