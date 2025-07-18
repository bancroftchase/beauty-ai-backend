import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Claude Client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ Utility: Safe JSON Parse
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("JSON parse failed:", err.message);
    return [];
  }
}

// ✅ Claude API Route
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    console.log(`🔍 Requesting products for category: ${category}`);

    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // ✅ Latest Claude model
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `
Generate a list of 75 beauty products for ${category}.
Return ONLY a valid JSON array (no text outside JSON).
Format: [
  {"name":"Product Name","price":"$XX.XX","description":"Brief description"}
]
Example:
[
  {"name":"Hydrating Face Cream","price":"$29.99","description":"Moisturizing cream with hyaluronic acid."}
]
          `
        }
      ]
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";
    const products = parseJSON(replyText);

    if (products.length > 0) {
      return res.json({ products });
    }

    console.warn("⚠ No products parsed from Claude response.");
    return res.json({ products: [] });

  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Claude API request failed" });
  }
});

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend with Claude is running!");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
