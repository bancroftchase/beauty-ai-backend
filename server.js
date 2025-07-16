import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Claude endpoint for universal AI chat
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required." });
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });

    const prompt = `
    You are a global beauty product expert.
    The user asked for: "${category}".
    Respond ONLY with this JSON format:
    {
      "reply": "Brief conversational text response for the user",
      "products": [
        { "name": "Product 1", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 2", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 3", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 4", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 5", "price": "$XX.XX", "description": "Short appealing description" }
        { "name": "Product 6", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 7", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 8", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 9", "price": "$XX.XX", "description": "Short appealing description" },
        { "name": "Product 10", "price": "$XX.XX", "description": "Short appealing description" }
      ]
    }
    Make sure it is VALID JSON, no extra text or comments.
    `;

    const completion = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    });

    let jsonText = completion.content[0].text.trim();
    jsonText = jsonText.replace(/```json|```/g, "").trim();

    const data = JSON.parse(jsonText);
    res.json(data);

  } catch (error) {
    console.error("Claude API error:", error.message);
    res.status(500).json({ error: "Claude AI call failed." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Beauty AI Backend running on port ${PORT}`);
});
