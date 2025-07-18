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

// ✅ Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ✅ OpenAI fallback client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Claude → OpenAI fallback route
app.post("/ask-claude", async (req, res) => {
  const { category, offset = 0, limit = 30 } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    console.log(`🔍 Requesting Claude for category: ${category}, offset: ${offset}, limit: ${limit}`);

    // ✅ Claude Request
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Generate ${limit} beauty products for "${category}" starting from item #${offset + 1}.
Return ONLY a JSON array like:
[
 {"name":"Product Name","price":"$XX.XX","description":"Short description"},
 ...
]`
        }
      ]
    });

    const textResponse = claudeResponse.content?.[0]?.text || "[]";
    let products = parseJSON(textResponse);

    if (!products.length) {
      console.log("⚠️ Claude returned empty. Falling back to OpenAI...");
      products = await getOpenAIProducts(category, limit);
    }

    res.json({ products });
  } catch (error) {
    console.error("Claude API Error:", error.response?.data || error.message);
    const fallback = await getOpenAIProducts(category, limit);
    res.json({ products: fallback });
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

// ✅ OpenAI fallback method
async function getOpenAIProducts(category, limit) {
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
          content:
            "You are a beauty product expert. Respond ONLY with a JSON array of products in this format: [{\"name\":\"Product Name\",\"price\":\"$XX.XX\",\"description\":\"Brief description\"}]"
        },
        {
          role: "user",
          content: `Generate ${limit} beauty products for "${category}".`
        }
      ]
    });

    const text = response.choices?.[0]?.message?.content || "[]";
    return parseJSON(text);
  } catch (error) {
    console.error("OpenAI fallback error:", error.message);
    return [];
  }
}

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Beauty AI Backend is running with Claude + OpenAI fallback");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
