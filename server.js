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

// ✅ Debug Key
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);

// ✅ Claude Client
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
    // ✅ Claude API call
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `List 10 beauty products for ${category}. 
          Provide ONLY JSON format:
          [{"name": "Product Name", "price": "$XX.XX", "description": "Brief description"}]`,
        },
      ],
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";

    // ✅ Try to parse JSON response
    const products = parseJSON(replyText);

    if (products.length > 0) {
      return res.json({ products });
    } else {
      return res.json({ products: [] });
    }
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Claude API call failed." });
  }
});

// ✅ JSON Parser
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend (Claude Only) is running");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
