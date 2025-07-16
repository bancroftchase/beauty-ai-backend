import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 10000;

// ✅ Primary route: Ask AI
app.post("/ask-ai", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    // ✅ Try Claude first
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 300,
      messages: [{ role: "user", content: `Recommend 5 beauty products for: ${query}. Format: JSON with name, price, description.` }]
    });

    const aiText = claudeResponse.content[0]?.text || "";
    const products = extractProducts(aiText);

    if (products.length) {
      return res.json({ reply: aiText, products });
    }

    throw new Error("Claude returned no products");
  } catch (err) {
    console.error("Claude failed, switching to OpenAI:", err.message);

    try {
      // ✅ Fallback to OpenAI
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: "You are a beauty expert AI." },
          { role: "user", content: `Recommend 5 beauty products for: ${query}. Format: JSON with name, price, description.` }
        ],
        max_tokens: 300
      });

      const aiText = gptResponse.choices[0].message.content;
      const products = extractProducts(aiText);

      return res.json({ reply: aiText, products });
    } catch (openaiErr) {
      console.error("OpenAI fallback failed:", openaiErr.message);
      return res.status(500).json({ error: "Both AI services failed" });
    }
  }
});

// ✅ Utility: Extract JSON safely
function extractProducts(text) {
  try {
    const match = text.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
