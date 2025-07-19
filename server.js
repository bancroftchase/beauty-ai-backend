import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/ask-claude', async (req, res) => {
  try {
    const { category } = req.body;
    
    // STRICTER PROMPT ENGINEERING
    const prompt = `Provide exactly 10 beauty products for "${category}" in this EXACT JSON format:
    
\`\`\`json
[
  {
    "name": "Product Name",
    "price": "$XX.XX",
    "description": "Brief description",
    "country": "Origin country"
  }
]
\`\`\`

Requirements:
1. Only return the JSON array
2. No additional text before or after
3. Include all 4 fields for each product
4. Products must relate to "${category}"`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    // More robust parsing
    const jsonString = response.content[0].text.replace(/```json|```/g, '').trim();
    const products = JSON.parse(jsonString);

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No valid products found in response');
    }

    return res.json({ products });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: "Failed to fetch products",
      details: error.message,
      solution: "Try rephrasing your search or check the logs"
    });
  }
});

app.listen(process.env.PORT || 3000, () => 
  console.log('Server ready'));
