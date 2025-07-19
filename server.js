const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const anthropic = new Anthropic(process.env.ANTHROPIC_API_KEY);

app.use(express.json());

app.post('/search-beauty-products', async (req, res) => {
  try {
    const { category, priceRange, countryPreference, productType } = req.body;

    const prompt = `
      Find up to 50 beauty products and related items based on this user request: "${category}".
      
      Search across these categories:
      - Skincare (cleansers, moisturizers, serums, masks)
      - Makeup (lipstick, foundation, eyeshadow, etc.)
      - Haircare (shampoos, conditioners, treatments)
      - Beauty accessories (brushes, combs, mirrors, organizers)
      - Tools (hair dryers, straighteners, curlers)
      - Foot care (creams, scrubs, pedicure tools)
      - Bath & body (soaps, lotions, bath salts)
      - Country-specific collections (K-Beauty, J-Beauty, French pharmacy, etc.)
      - Popular brands across all categories
      - Price ranges: ${priceRange || 'all'}
      - Natural, organic, or luxury products when relevant

      For accessories include:
      - Makeup brushes (foundation, eyeshadow, blending)
      - Hair brushes (paddle, round, detangling)
      - Combs (wide-tooth, fine-tooth, styling)
      - Beauty sponges and applicators
      - Eyelash curlers and tweezers
      - Nail care tools

      For foot care include:
      - Foot creams and lotions
      - Exfoliating scrubs
      - Callus removers
      - Pedicure sets
      - Toe separators
      - Foot masks

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
