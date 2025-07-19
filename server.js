import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Ensure this is set in Render
});

app.use(cors());
app.use(express.json());

app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category } = req.body;

    const prompt = `Find beauty products about: ${category}. Include tanning, accessories, foot care. Respond in JSON format: [{"name":"Product","price":"$XX","description":"...","country":"..."}]`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229", // Updated model name
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
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
