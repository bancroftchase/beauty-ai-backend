import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

// 1. Load environment variables FIRST
dotenv.config();

// 2. Verify API key is loaded
console.log('API Key:', process.env.ANTHROPIC_API_KEY ? 'Loaded' : 'Missing');

const app = express();

// 3. Initialize Anthropic with proper config
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

app.use(cors());
app.use(express.json());

app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category } = req.body;
    
    const prompt = `Find beauty products about ${category} in JSON format exactly like:
    [{
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

    const products = JSON.parse(response.content[0].text);
    res.json(products);
    
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ 
      error: "Beauty search failed",
      details: error.message,
      hint: "Check Render environment variables"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on ${PORT}`));
