import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Check keys at startup
console.log("Claude Key:", process.env.CLAUDE_API_KEY ? "✅ Found" : "❌ Missing");
console.log("OpenAI Key:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");

// ✅ Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ Initialize OpenAI fallback client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Utility: Parse JSON safely
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ Claude + OpenAI Logic
app.post("/ask-claude", async (req, res) => {
  const { category, limit = 50, offset = 0 } = req.body;
  if (!category) return res.status(400).json({ error: "Category is required" });

  console.log(`🔍 Requesting Claude for category: ${category}`);

  try {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Provide ${limit} beauty products starting from item ${offset} for category: ${category}.
          Respond ONLY with JSON in this format:
          [{"name":"Product Name","price":"$XX.XX","description":"Short description"}]`,
        },
      ],
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";
    let products = parseJSON(replyText);

    if (products.length > 0) {
      return res.json({ products });
    }

    console.log("⚠️ Claude returned empty. Falling back to OpenAI...");
    const fallback = await getOpenAIProducts(category, limit, offset);
    return res.json({ products: fallback });
  } catch (error) {
    console.error("Claude API Error:", error.message);
    const fallback = await getOpenAIProducts(category, limit, offset);
    return res.json({ products: fallback });
  }
});

// ✅ OpenAI Fallback Logic
async function getOpenAIProducts(category, limit, offset) {
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
          content: "You are a beauty product expert. Respond ONLY in JSON array format: [{\"name\":\"...\",\"price\":\"$...\",\"description\":\"...\"}]",
        },
        {
          role: "user",
          content: `Provide ${limit} beauty products starting from ${offset} for category: ${category}`,
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "[]";
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

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
