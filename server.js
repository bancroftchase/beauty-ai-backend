import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

app.use(cors());
app.use(express.json());

// Unified endpoint handler
async function handleProductRequest(category) {
  const prompt = `Provide beauty products for "${category}" in this EXACT JSON format:
  
[
  {
    "name": "Product Name",
    "price": "$XX.XX",
    "description": "Brief description",
    "country": "Origin country"
  }
]`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });

  // Robust JSON parsing
  const jsonString = response.content[0].text
    .replace(/```json|```/g, '')
    .trim();
  return JSON.parse(jsonString);
}

// Support both endpoints
app.post(['/ask-claude', '/search-beauty-products'], async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: "Category is required" });

    const products = await handleProductRequest(category);
    res.json({ products });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: "Failed to fetch products",
      details: error.message
    });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
