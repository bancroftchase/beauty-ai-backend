const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Configure CORS for frontend
app.use(cors({
    origin: 'https://beauty-static-live.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Mock product data (replace with your 3,100 products or Firestore integration)
const products = [
    { id: 1, name: 'Mexican Aloe Vera Gel', region: 'Mexico', price: '$25 USD', category: 'Skincare' },
    { id: 2, name: 'French Rose Serum', region: 'France', price: '€45', category: 'Skincare' },
    { id: 3, name: 'German Vitamin C Cream', region: 'Germany', price: '€35', category: 'Skincare' },
    { id: 4, name: 'Chinese Ginseng Mask', region: 'China', price: '¥180', category: 'Skincare' },
    // Add more products (up to 3,100)
];

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', productsLoaded: products.length });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        // Call Gemini API
        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
            {
                contents: [{ parts: [{ text: message }] }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': process.env.GEMINI_API_KEY
                }
            }
        );
        const reply = response.data.candidates[0].content.parts[0].text;

        // Optional: Include product recommendations with pagination
        let productRecommendations = [];
        if (message.toLowerCase().includes('recommend')) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 500;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            if (message.toLowerCase().includes('k-beauty')) {
                productRecommendations = products.filter(p => p.category === 'K-Beauty').slice(startIndex, endIndex);
            } else if (message.toLowerCase().includes('tanning')) {
                productRecommendations = products.filter(p => p.category === 'Tanning').slice(startIndex, endIndex);
            } else if (message.toLowerCase().includes('eye care') || message.toLowerCase().includes('eyelash')) {
                productRecommendations = products.filter(p => p.category === 'Eye Care').slice(startIndex, endIndex);
            } else {
                productRecommendations = products.slice(startIndex, endIndex);
            }
        }

        res.json({ reply, products: productRecommendations });
    } catch (error) {
        console.error('Gemini API error:', error.message);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Product catalog endpoint
app.get('/api/products', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 500;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    res.json({
        products: paginatedProducts,
        total: products.length,
        page,
        limit
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Beauty AI Backend running on port ${PORT}`));
