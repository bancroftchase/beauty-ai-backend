import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Debug logs for environment keys
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);
console.log("OpenAI Key Exists:", !!process.env.OPENAI_API_KEY);

// ✅ Claude Client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ OpenAI Client (Fallback)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ✅ Route: AI Recommendation (Claude → OpenAI fallback)
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  console.log(`🔍 Requesting Claude for category: ${category}`);

  try {
    // ✅ Claude Request
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: `Generate a list of 50 beauty products for the category "${category}".
Respond ONLY with valid JSON array in this format:
[
  {"name": "Product Name", "price": "$XX.XX", "description": "Short description"},
  ...
]`
        }
      ]
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";
    const products = safeParseJSON(replyText);

    if (products.length > 0) {
      return res.json({ products });
    }

    console.warn("⚠️ Claude returned empty. Falling back to OpenAI...");
    const fallbackProducts = await getOpenAIProducts(category);
    return res.json({ products: fallbackProducts });

  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);

    const fallbackProducts = await getOpenAIProducts(category);
    return res.json({ products: fallbackProducts });
  }
});

// ✅ Safe JSON Parser
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ JSON Parse Error:", e.message);
    return [];
  }
}

// ✅ OpenAI Fallback
async function getOpenAIProducts(category) {
  if (!openai) {
    console.warn("⚠️ No OpenAI key provided. Returning empty list.");
    return [];
  }

  try {
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a beauty product assistant. Respond ONLY in JSON array format with this structure: [{\"name\":\"Product Name\",\"price\":\"$XX.XX\",\"description\":\"Brief description\"}]"
        },
        {
          role: "user",
          content: `Give me 50 beauty products for ${category}.`
        }
      ]
    });

    const text = openaiResponse.choices?.[0]?.message?.content || "[]";
    return safeParseJSON(text);
  } catch (error) {
    console.error("OpenAI Fallback Error:", error.message);
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
