import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Debug logs
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);
console.log("OpenAI Key Exists:", !!process.env.OPENAI_API_KEY);

// ✅ Claude Client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ OpenAI Client (fallback)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// ✅ Helper to parse JSON safely
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ Claude Primary Route
app.post("/ask-claude", async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    console.log(`🔍 Requesting Claude for category: ${category}`);

    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // ✅ Correct model
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Provide a list of 100 beauty products for category "${category}".
          Format as JSON array:
          [
            {"name": "Product Name", "price": "$XX.XX", "description": "Brief description"}
          ]
          Only return valid JSON.`
        }
      ]
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";
    let products = parseJSON(replyText);

    if (products.length > 0) {
      console.log(`✅ Claude returned ${products.length} products`);
      return res.json({ products });
    }

    console.log("⚠️ Claude returned empty. Falling back to OpenAI...");
    const fallback = await getOpenAIProducts(category);
    return res.json({ products: fallback });

  } catch (error) {
    console.error("❌ Claude API Error:", error.message);
    const fallback = await getOpenAIProducts(category);
    return res.json({ products: fallback });
  }
});

// ✅ OpenAI Fallback
async function getOpenAIProducts(category) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ No OpenAI key provided. Returning empty list.");
    return [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a beauty product assistant. Respond ONLY in JSON array format:
          [
            {"name":"Product Name","price":"$XX.XX","description":"Short description"}
          ]`
        },
        {
          role: "user",
          content: `Give me 100 beauty products for ${category}.`
        }
      ]
    });

    const text = response.choices?.[0]?.message?.content || "[]";
    return parseJSON(text);

  } catch (error) {
    console.error("❌ OpenAI fallback error:", error.message);
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
