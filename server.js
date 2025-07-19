import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

app.use(cors());
app.use(express.json());

function parseClaudeResponse(text) {
  // 1. First try direct JSON parse
  try {
    return JSON.parse(text);
  } catch (e) { /* Continue to other methods */ }

  // 2. Try extracting JSON from markdown code block
  const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/)?.[1];
  if (jsonBlock) {
    try {
      return JSON.parse(jsonBlock);
    } catch (e) { /* Continue */ }
  }

  // 3. Try extracting just the array portion
  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');
  if (arrayStart > -1 && arrayEnd > -1) {
    try {
      return JSON.parse(text.slice(arrayStart, arrayEnd + 1));
    } catch (e) { /* Continue */ }
  }

  // 4. Final fallback - return empty array
  console.warn('Could not parse response:', text);
  return [];
}

app.post('/ask-claude', async (req, res) => {
  try {
    const { category } = req.body;
    
    const prompt = `Provide 10 beauty products for "${category}" in this EXACT format:

[
  {
    "name": "Product Name",
    "price": "$XX.XX",
    "description": "Brief description",
    "country": "Origin country"
  }
]

Rules:
1. Only return the JSON array
2. No additional text or explanations
3. All fields must be included`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    const products = parseClaudeResponse(response.content[0].text);

    if (!products.length) {
      return res.status(404).json({ 
        error: "No products found",
        solution: "Try different search terms like 'tanning lotion' or 'moisturizer'"
      });
    }

    return res.json({ products });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: "Search failed",
      details: error.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => 
  console.log('Server ready'));
