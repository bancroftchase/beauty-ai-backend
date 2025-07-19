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

// Your original working endpoint
app.post('/ask-claude', async (req, res) => {
  try {
    const { category } = req.body;
    const prompt = `Provide beauty products for ${category} in JSON format: [{"name":"Product","price":"$XX","description":"..."}]`;
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ products: JSON.parse(response.content[0].text) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to match your frontend
app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category } = req.body;
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `List beauty products for ${category} in JSON format:
        [{"name":"Product","price":"$XX","description":"..."}]`
      }]
    });

    res.json({ products: JSON.parse(response.content[0].text) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
