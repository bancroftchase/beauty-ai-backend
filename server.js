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

// ✅ Claude Client
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// ✅ OpenAI Client (Fallback)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Ask Claude (Primary) with Pagination
app.post("/ask-claude", async (req, res) => {
  const { category, offset = 0, count = 20 } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // ✅ Correct Claude model
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Generate ${count} unique beauty products starting at position ${offset} for category: ${category}.
          Respond ONLY with JSON in this format:
          [{"name":"Product Name","price":"$XX.XX","description":"Brief description"}]`
        }
      ]
    });

    const text = claudeResponse.content?.[0]?.text || "[]";
    const products = parseJSON(text);

    if (products.length > 0) {
      return res.json({ products });
    }

    // ✅ If Claude fails → Fallback
    const fallback = await getOpenAIProducts(category, count, offset);
    return res.json({ products: fallback });
  } catch (error) {
    console.error("Claude API Error:", error.message);
    const fallback = await getOpenAIProducts(category, count, offset);
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

// ✅ OpenAI fallback with pagination
async function getOpenAIProducts(category, count, offset) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a beauty product assistant. Respond ONLY in JSON format like:
          [{"name":"Product Name","price":"$XX.XX","description":"Brief description"}]`
        },
        {
          role: "user",
          content: `Generate ${count} beauty products starting at position ${offset} for category: ${category}`
        }
      ]
    });

    const text = response.choices?.[0]?.message?.content || "[]";
    return parseJSON(text);
  } catch (err) {
    console.error("OpenAI fallback error:", err.message);
    return [];
  }
}

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running");
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
