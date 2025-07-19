import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // MUST be set in Render
});

app.use(cors());
app.use(express.json());

app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: "Category parameter is required" });
    }

    const prompt = `Find beauty products about ${category} in JSON format: [{
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
