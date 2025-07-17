import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Initialize Claude Client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ Claude API Route
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    console.log(`🔍 Request for category: ${category}`);

    // Call Claude API
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // ✅ Latest Sonnet model
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Generate a JSON array of 10 beauty products for category "${category}".
          Each item must have:
          - name
          - price
          - description
          
          Example format:
          [
            {"name": "Glow Serum", "price": "$29.99", "description": "Hydrating serum with vitamin C."},
            {"name": "Luxury Cream", "price": "$59.99", "description": "Premium moisturizing cream for radiant skin."}
          ]`
        }
      ]
    });

    const text = claudeResponse.content?.[0]?.text || "[]";
    const products = parseJSON(text);

    if (!products.length) {
      return res.json({ products: [] });
    }

    res.json({ products });
  } catch (error) {
    console.error("Claude API Error:", error.message);
    res.status(500).json({ error: "Claude API call failed" });
  }
});

// ✅ JSON Parser (Safe)
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    console.warn("Invalid JSON response from Claude");
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running with Claude");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
