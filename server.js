const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Anthropic } = require('@anthropic-ai/sdk');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
});

// ✅ Mock Product Generator
function getMockProducts(category) {
    const mockDB = {
        "Global Beauty": [
            { name: "French Luxury Serum", price: "$120", description: "High-end anti-aging serum from France." },
            { name: "Korean Snail Cream", price: "$35", description: "Hydrating cream with snail mucin." },
            { name: "Brazilian Hair Oil", price: "$25", description: "Smooth and strengthen your hair naturally." }
        ],
        "K-Beauty": [
            { name: "Laneige Water Sleeping Mask", price: "$32", description: "Overnight hydration for glowing skin." },
            { name: "Cosrx Snail Essence", price: "$18", description: "Repair and rejuvenate with snail extract." }
        ],
        "Natural Beauty": [
            { name: "Organic Aloe Gel", price: "$10", description: "Pure aloe vera gel for skin soothing." },
            { name: "Botanical Facial Oil", price: "$22", description: "Nourishing oil with natural botanicals." }
        ]
    };
    return mockDB[category] || [];
}

// ✅ Claude-powered AI + Mock Products
app.post('/ask-claude', async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });

    try {
        const response = await anthropic.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 250,
            messages: [{ role: "user", content: `Give a short intro about ${category} beauty products.` }]
        });

        const aiText = response.content[0]?.text || "Here are some products for you:";
        const products = getMockProducts(category);

        res.json({ reply: aiText, products });
    } catch (error) {
        console.error('Claude API Error:', error.message);
        res.status(500).json({ error: 'AI request failed' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Beauty AI Backend running on port ${PORT}`);
});
