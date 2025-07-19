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

// ORIGINAL WORKING PROMPT FORMAT
const generatePrompt = (category) => `
Find up to 50 beauty products based on: "${category}".

Search across:
- Product types (lipstick, moisturizer, etc.)
- Country-specific collections (K-Beauty = Korean brands)
- Popular brands
- Price ranges
- Natural or luxury products

Respond ONLY in JSON format:
[{"name":"Product Name","price":"$XX","description":"Brief description","country":"Country"}]
`;

// UNIFIED ENDPOINT HANDLER
app.post(['/ask-claude', '/search-beauty-products'], async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    console.log(`Searching for: ${category}`);
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: generatePrompt(category)
      }]
    });

    // ORIGINAL PARSING LOGIC
    const products = parseProducts(response.content[0].text);
    
    if (!products.length) {
      return res.json({ 
        products: [],
        message: "No products found. Try different terms like 'K-Beauty serums'"
      });
    }

    return res.json({ products });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: "Search failed",
      details: error.message
    });
  }
});

// ORIGINAL PRODUCT PARSER
function parseProducts(text) {
  try {
    // First try direct parse
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    
    // Fallback: extract array from text
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    return [];
  } catch (e) {
    console.warn('Parse error, returning empty results');
    return [];
  }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
