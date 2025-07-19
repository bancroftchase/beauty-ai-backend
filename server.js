import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const anthropic = new Anthropic(process.env.ANTHROPIC_API_KEY);

app.use(express.json());

app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category, priceRange, countryPreference, productType } = req.body;

    const prompt = `
      Find up to 50 beauty products and related items based on this user request: "${category}".
      
      Search across:
      - Skincare (cleansers, moisturizers, serums, masks)
      - Makeup (lipstick, foundation, eyeshadow)
      - Haircare (shampoos, conditioners, treatments)
      - Tanning products (lotions, mousses, sprays, sunless tanners)
      - Beauty accessories (brushes, combs, mirrors)
      - Tools (hair dryers, straighteners, curlers)
      - Foot care (creams, scrubs, pedicure tools)
      - Bath & body (soaps, lotions, bath salts)
      - Country-specific collections (K-Beauty, J-Beauty, French pharmacy)
      - Popular global brands
      - Price ranges: ${priceRange || 'all'}
      - Natural, organic, or luxury products when relevant

      For tanning include:
      - Self-tanners
      - Bronzers
      - Tanning oils
      - Gradual tanners
      - Tan extenders
      - Tan removers

      Respond ONLY in JSON format:
      [{
        "name": "Product Name",
        "price": "$XX",
        "category": "Product category",
        "description": "Brief description",
        "country": "Country of origin/brand",
        "type": "Specific product type"
      }]
    `;

    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const products = JSON.parse(claudeResponse.content[0].text);
    res.json(products);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch beauty products' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
