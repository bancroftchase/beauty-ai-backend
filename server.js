import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint (GET /)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Beauty AI Backend Service',
    endpoints: {
      search: 'POST /search-beauty-products',
      claude: 'POST /ask-claude'
    }
  });
});

// 2. Original Working Prompt Format
const generatePrompt = (category) => `
Find up to 50 beauty products for "${category}" including:

- K-Beauty (Korean brands)
- J-Beauty (Japanese brands)
- Western brands
- Luxury and drugstore products

Respond in STRICT JSON format ONLY:
[{
  "name": "Product Name",
  "price": "$XX.XX",
  "description": "Brief description",
  "country": "Origin country",
  "category": "${category}"
}]

Rules:
1. No additional text outside the JSON
2. Must include all specified fields
3. Return empty array if no products found`;

// 3. Unified Product Search Handler
const handleProductSearch = async (category) => {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: generatePrompt(category)
    }]
  });

  // Robust JSON parsing with multiple fallbacks
  try {
    const cleanText = response.content[0].text
      .replace(/```json|```/g, '')
      .trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn('Fallback parsing attempt');
    const arrayStart = response.content[0].text.indexOf('[');
    const arrayEnd = response.content[0].text.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(response.content[0].text.slice(arrayStart, arrayEnd + 1));
    }
    return [];
  }
};

// 4. Supported Search Endpoints
app.post(['/search-beauty-products', '/ask-claude'], async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ 
        error: "Category parameter required",
        example: { "category": "K-Beauty" }
      });
    }

    const products = await handleProductSearch(category);
    
    if (!products.length) {
      return res.status(404).json({
        products: [],
        message: `No ${category} products found. Try: "K-Beauty serums", "Japanese sunscreens", or "luxury moisturizers"`
      });
    }

    return res.json({ products });

  } catch (error) {
    console.error('Search Error:', error);
    return res.status(500).json({
      error: "Search failed",
      details: error.message,
      solution: "Please try again or contact support"
    });
  }
});

// 5. Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: {
      healthCheck: "GET /",
      productSearch: "POST /search-beauty-products",
      claudeSearch: "POST /ask-claude"
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔍 Try: curl -X POST http://localhost:${PORT}/search-beauty-products -H "Content-Type: application/json" -d '{"category":"K-Beauty"}'`);
});
