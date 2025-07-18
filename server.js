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

// ✅ Debug keys
console.log("Claude Key Exists:", !!process.env.CLAUDE_API_KEY);
console.log("OpenAI Key Exists:", !!process.env.OPENAI_API_KEY);

// ✅ Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ OpenAI fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// ✅ Main route
app.post("/ask-claude", async (req, res) => {
  const { category, limit = 50, offset = 0 } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  console.log(`🔍 Requesting Claude for category: ${category}, limit: ${limit}, offset: ${offset}`);

  try {
    // ✅ Claude request
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Generate a JSON array of ${limit} beauty products starting from item #${offset + 1} for category: ${category}.
Each object should have: name, price, description.
Format example:
[{"name":"Product 1","price":"$29.99","description":"Brief description"}]`,
        },
      ],
    });

    const replyText = claudeResponse.content?.[0]?.text || "[]";
    let products = parseJSON(replyText);

    if (products.length === 0) {
      console.warn("⚠️ Claude returned empty. Falling back to OpenAI...");
      products = await getOpenAIProducts(category, limit, offset);
    }

    return res.json({ products });
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    const fallback = await getOpenAIProducts(category, limit, offset);
    return res.json({ products: fallback });
  }
});

// ✅ Helper: parse JSON safely
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ✅ OpenAI fallback
async function getOpenAIProducts(category, limit, offset) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ No OpenAI key provided. Returning empty list.");
      return [];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a beauty product assistant. Return ONLY a JSON array of products, no extra text.
Each object: {"name":"Product","price":"$XX","description":"Brief description"}.`,
        },
        {
          role: "user",
          content: `Generate ${limit} beauty products starting from item #${offset + 1} for category: ${category}.`,
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

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running");
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
