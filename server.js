import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

// 1. ENSURE PROPER ENV LOADING
dotenv.config({ path: '.env.production' }); // Explicit path

// 2. VERIFY KEYS ARE LOADING
console.log("Claude Key:", process.env.CLAUDE_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("OpenAI Key:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// 3. SAFER CLIENT INITIALIZATION
const anthropic = process.env.CLAUDE_API_KEY 
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ✅ Claude Primary Endpoint (ORIGINAL WORKING VERSION)
app.post("/ask-claude", async (req, res) => {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: "Category is required" });

    // 4. EXPLICIT ERROR IF NO API KEYS
    if (!anthropic && !openai) {
        return res.status(500).json({ 
            error: "No API keys configured",
            solution: "Check Render environment variables"
        });
    }

    try {
        console.log(`🔍 Requesting products for: ${category}`);
        
        // 5. ATTEMPT CLAUDE FIRST
        if (anthropic) {
            const claudeResponse = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 2000,
                messages: [{
                    role: "user",
                    content: `Generate 100 beauty products for ${category} in JSON format:
                    [{"name":"Product","price":"$XX","description":"..."}]`
                }]
            });

            const products = safeParse(claudeResponse.content?.[0]?.text);
            if (products.length > 0) return res.json({ products });
        }

        // 6. FALLBACK TO OPENAI
        if (openai) {
            const fallback = await getOpenAIProducts(category);
            return res.json({ products: fallback });
        }

        return res.json({ products: [] });

    } catch (error) {
        console.error("API Error:", error.message);
        try {
            const fallback = await getOpenAIProducts(category);
            return res.json({ products: fallback });
        } catch (fallbackError) {
            return res.status(500).json({ 
                error: "All APIs failed",
                details: error.message
            });
        }
    }
});

// ✅ ORIGINAL SAFE PARSE FUNCTION
function safeParse(jsonString) {
    try {
        return JSON.parse(jsonString) || [];
    } catch {
        console.warn("⚠️ Failed to parse JSON response");
        return [];
    }
}

// ✅ ORIGINAL OPENAI FALLBACK
async function getOpenAIProducts(category) {
    if (!openai) return [];
    
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "user",
                content: `List beauty products for ${category} in JSON format:
                [{"name":"Product","price":"$XX","description":"..."}]`
            }]
        });
        return safeParse(response.choices?.[0]?.message?.content);
    } catch (error) {
        console.error("OpenAI Error:", error.message);
        return [];
    }
}

// ✅ HEALTH CHECK
app.get("/", (req, res) => res.send("✅ Beauty AI Backend Online"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
