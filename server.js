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

// ✅ Claude & OpenAI Clients
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Claude Primary Endpoint
app.post("/ask-claude", async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: "Category is required" });

    try {
        console.log(`🔍 Requesting Claude for category: ${category}`);
        const claudeResponse = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022", // ✅ Updated model
            max_tokens: 2000,
            messages: [
                {
                    role: "user",
                    content: `Generate 100 beauty products for ${category}.
                    Respond ONLY in pure JSON format like:
                    [
                        {"name": "Product Name", "price": "$XX.XX", "description": "Short description"},
                        ...
                    ]`
                }
            ]
        });

        const replyText = claudeResponse.content?.[0]?.text || "[]";
        const products = parseJSON(replyText);

        if (products.length > 0) return res.json({ products });

        console.warn("⚠️ Claude returned empty. Falling back to OpenAI...");
        const fallback = await getOpenAIProducts(category);
        return res.json({ products: fallback });
    } catch (error) {
        console.error("Claude API Error:", error.response?.data || error.message);
        const fallback = await getOpenAIProducts(category);
        return res.json({ products: fallback });
    }
});

// ✅ Parse JSON safely
function parseJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        console.warn("⚠️ Failed to parse JSON");
        return [];
    }
}

// ✅ OpenAI Fallback Logic
async function getOpenAIProducts(category) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("⚠️ No OpenAI key provided. Returning empty list.");
        return [];
    }

    try {
        const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a beauty product expert. Respond ONLY in JSON format:
                    [{"name":"Product Name","price":"$XX.XX","description":"Short description"}]`
                },
                {
                    role: "user",
                    content: `List 100 beauty products for ${category}.`
                }
            ]
        });

        const text = openaiResponse.choices?.[0]?.message?.content || "[]";
        return parseJSON(text);
    } catch (error) {
        console.error("OpenAI fallback error:", error.message);
        return [];
    }
}

// ✅ Health Check
app.get("/", (req, res) => res.send("✅ Beauty AI Backend is running"));

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
