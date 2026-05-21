import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () =>
  genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

const sendProviderError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: "AI failed" });
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const systemPrompt = `You are BiasLens AI, a dual-purpose assistant that provides:
1. Analytics Insights — data-driven analysis of business questions
2. Bias Detection — identifying cognitive biases in the user's reasoning

For EVERY user message, respond with a JSON object containing:
{
  "analytics": "Your analytical response to the user's question with data-driven insights",
  "biasDetected": true/false,
  "biasType": "Name of the cognitive bias (if detected)",
  "biasSeverity": "High" | "Medium" | "Low" (if detected),
  "biasTrigger": "The exact phrase that triggered the bias detection (if detected)",
  "biasExplanation": "Explanation of why this is a bias (if detected)",
  "recommendations": ["Array of 2-3 actionable recommendations to counter the bias (if detected)"]
}

Always respond with valid JSON only. No markdown, no extra text.`;

    const normalized = messages
      .filter((m) => m && typeof m === "object")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: typeof m.content === "string" ? m.content : "",
      }))
      .filter((m) => m.content.trim().length > 0);

    const prompt = [
      `SYSTEM:\n${systemPrompt}`,
      ...normalized.map((m) => `${m.role.toUpperCase()}:\n${m.content}`),
      "ASSISTANT:\n",
    ].join("\n\n");

    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";

    return res.json({ content: text });
  } catch (error) {
    return sendProviderError(res, error);
  }
});

app.post("/api/scan-document", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text string is required" });
    }

    const systemPrompt = `You are BiasLens Document Scanner. Analyze the provided document text for cognitive biases at the sentence level.

For each sentence in the document, determine if it contains a cognitive bias. Return a JSON array where each element represents a sentence:

[
  {
    "text": "The original sentence",
    "severity": "none" | "low" | "medium" | "high",
    "biasType": "Name of bias (only if severity is not 'none')",
    "explanation": "Why this is a bias (only if severity is not 'none')"
  }
]

Always respond with valid JSON array only. No markdown, no extra text.`;

    const prompt = [`SYSTEM:\n${systemPrompt}`, `USER:\n${text}`, "ASSISTANT:\n"].join("\n\n");

    const model = getModel();
    const result = await model.generateContent(prompt);
    const responseText = result?.response?.text?.() ?? "";

    return res.json({ content: responseText });
  } catch (error) {
    return sendProviderError(res, error);
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
