const express = require('express');
const cors = require('cors');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ✅ Check Environment Key
app.get('/check-env', (req, res) => {
  const anthKeyExists = !!process.env.ANTHROPIC_API_KEY;
  res.json({ ANTHROPIC_API_KEY: anthKeyExists ? '✅ Set' : '❌ Missing' });
});

// ✅ Claude Chat Endpoint
app.post('/ask-claude', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229', // Claude Sonnet
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const reply = response.content[0]?.text || '🤖 No response generated.';
    res.json({ reply });
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Claude API call failed.' });
  }
});

// ✅ Catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Beauty AI Backend running on port ${PORT}`);
});
