import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Changed to OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Make sure to set this in Render
});

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Beauty AI Backend Service',
    endpoints: {
      search: 'POST /search-beauty-products',
      claude: 'POST /ask-claude' // Keeping original endpoint names
    }
  });
});

// Original prompt format (unchanged)
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

// Updated to use OpenAI instead of Anthropic
const handleProductSearch = async (category) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview", // Using latest OpenAI model
    messages: [{
      role: "user",
      content: generatePrompt(category)
    }],
    response_format: { type: "json_object" }, // Ensures JSON output
    max_tokens: 2000
  });

  try {
    const content = response.choices[0].message.content;
    // Handle both direct JSON and wrapped responses
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.products || [];
  } catch (e) {
    console.error('Parsing error:', e);
    return [];
  }
};

// Original endpoints maintained
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
        message: `No ${category} products found. Try specific terms like "K-Beauty serums"`
      });
    }

    return res.json({ products });

  } catch (error) {
    console.error('Search Error:', error);
    return res.status(500).json({
      error: "Search failed",
      details: error.message
    });
  }
});

// Catch-all route
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: {
      healthCheck: "GET /",
      productSearch: "POST /search-beauty-products",
      claudeSearch: "POST /ask-claude" // Maintaining original endpoint name
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔍 Test with: curl -X POST http://localhost:${PORT}/search-beauty-products -H "Content-Type: application/json" -d '{"category":"K-Beauty"}'`);
});
