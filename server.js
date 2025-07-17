import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Debug API keys
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);
console.log("OpenAI Key Exists:", !!process.env.OPENAI_API_KEY);

// ✅ Claude Client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ OpenAI Client (fallback)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Claude Primary Route
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
          Provide JSON format: 
          [{"name": "...", "price": "...", "description": "..."}]`,
        },
      ],
    });

    const replyText =
      claudeResponse.content?.[0]?.text || "[]";

    const products = parseJSON(replyText);
    if (products.length > 0) {
      return res.json({ products });
    }

    // ✅ If no products → Fallback to OpenAI
    console.log("Claude returned empty. Falling back to OpenAI...");
    const fallback = await getOpenAIProducts(category);
    return res.json({ products: fallback });
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);

    // ✅ Fallback if Claude fails
    const fallback = await getOpenAIProducts(category);
    return res.json({ products: fallback });
  }
});

// ✅ Parse JSON safely
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ OpenAI Fallback
async function getOpenAIProducts(category) {
  try {
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a beauty product assistant. Respond ONLY in JSON array format with objects like: [{\"name\":\"Product Name\",\"price\":\"$XX.XX\",\"description\":\"Brief description\"}]",
        },
        {
          role: "user",
          content: `Give me 10 beauty products for ${category}.`,
        },
      ],
    });

    const text = openaiResponse.choices?.[0]?.message?.content || "[]";
    return parseJSON(text);
  } catch (error) {
    console.error("OpenAI fallback error:", error.message);
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
