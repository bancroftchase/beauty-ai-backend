import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Claude Client
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('✅ Beauty AI Backend Running with Claude');
});

// ✅ Generate Prompt
const generatePrompt = (category) => `
Find up to 80 beauty products based on: "${category}".

Include:
- Product types (lipstick, moisturizer, shampoo, etc.)
- Global categories (e.g., K-Beauty, French skincare)
- Popular brands
- Price ranges
- Tag if luxury or natural

Respond ONLY in JSON format:
[{"name":"Product Name","price":"$XX","description":"Brief description","country":"Country"}]
`;

// ✅ Main Endpoint
app.post(['/ask-claude', '/search-beauty-products'], async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });

    console.log(`🔍 Requesting Claude for category: ${category}`);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000, // Increased for 80+ products
      messages: [
        {
          role: 'user',
          content: generatePrompt(category)
        }
      ]
    });

    const textResponse = response.content?.[0]?.text || '';
    const products = parseProducts(textResponse);

    if (!products.length) {
      return res.json({
        products: [],
        message: `❌ No products found for "${category}". Try more specific keywords like 'luxury skincare' or 'K-Beauty serums'.`
      });
    }

    return res.json({ products });
  } catch (error) {
    console.error('Claude API Error:', error.message);
    return res.status(500).json({ error: 'AI service error', details: error.message });
  }
});

// ✅ Parse JSON safely
function parseProducts(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    return [];
  } catch {
    return [];
  }
}

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
