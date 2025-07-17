import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Debug Claude Key
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);

// ✅ Initialize Claude Client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// ✅ Claude AI Endpoint
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    // ✅ Claude request
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Generate a list of 10 beauty products for ${category}. 
            Respond ONLY in JSON format like:
            [
              {"name": "Product Name", "price": "$XX.XX", "description": "Brief description"}
            ]`
        }
      ]
    });

    const rawText = claudeResponse.content?.[0]?.text || "[]";
    const products = parseJSON(rawText);

    if (products.length === 0) {
      return res.json({ products: [] });
    }

    res.json({ products });
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Claude API call failed" });
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

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running with Claude");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
