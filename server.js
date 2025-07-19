import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

// 1. Load environment variables FIRST
dotenv.config();

// 2. Verify API key is loaded
console.log('API Key Status:', process.env.CLAUDE_API_KEY ? '✅ Loaded' : '❌ Missing');

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY // Using CLAUDE_API_KEY as in your working version
});

// 3. Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 4. Health check endpoint
app.get('/', (req, res) => res.send('Beauty AI Backend is running ✅'));

// 5. MAIN ENDPOINT (using your original working path)
app.post('/ask-claude', async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: "Category parameter is required" });
    }

    const prompt = `Provide beauty products for ${category} in STRICT JSON format ONLY:
    [{
      "name": "Product Name",
      "price": "$XX.XX",
      "description": "Brief description",
      "country": "Origin country"
    }]`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Your working model
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    // 6. Robust JSON parsing
    let products;
    try {
      products = JSON.parse(response.content[0].text);
    } catch (parseError) {
      console.error('Parse error, trying to extract JSON:', parseError);
      // Try extracting JSON from markdown code block
      const jsonMatch = response.content[0].text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[1]);
      } else {
        products = [];
      }
    }

    return res.json({ products });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: "Failed to fetch products",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
