import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Check Claude API key
if (!process.env.CLAUDE_API_KEY) {
  console.error("❌ Missing CLAUDE_API_KEY in environment variables");
  process.exit(1);
}

// ✅ Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ Claude route
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `List 10 beauty products for ${category}. Respond in JSON array format: [{"name": "...", "price": "...", "description": "..."}]`
        }
      ]
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";
    const products = parseJSON(replyText);

    if (products.length > 0) {
      return res.json({ products });
    } else {
      return res.json({ products: [] });
    }
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Claude API call failed" });
  }
});

// ✅ Safe JSON parser
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend running with Claude");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
