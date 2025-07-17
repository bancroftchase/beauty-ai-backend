// ✅ server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Debugging keys
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);

// ✅ Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// ✅ Claude Route
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: "Category is required" });

  try {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `List 10 beauty products for ${category}.
          Return ONLY JSON array format:
          [{"name":"Product Name","price":"$XX.XX","description":"Brief description"}]`
        }
      ]
    });

    const rawText = claudeResponse.content?.[0]?.text || "[]";
    const products = parseJSON(rawText);

    return res.json({ products });
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Claude request failed" });
  }
});

// ✅ Helper: Parse JSON safely
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => res.send("✅ Beauty AI Backend is running"));

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
