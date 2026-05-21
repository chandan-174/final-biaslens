import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not configured`);
  return v;
};

const normalizeMessages = (messages: unknown) => {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m === "object")
    .map((m) => {
      const obj = m as Record<string, unknown>;
      const role = obj.role === "assistant" ? "model" : "user";
      const content = typeof obj.content === "string" ? obj.content : "";
      return { role, content };
    })
    .filter((m) => m.content.trim().length > 0);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages } = (req.body ?? {}) as { messages?: unknown };
    const normalized = normalizeMessages(messages);
    if (normalized.length === 0) return res.status(400).json({ error: "messages array is required" });

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

    const prompt = [
      `SYSTEM:\n${systemPrompt}`,
      ...normalized.map((m) => `${m.role.toUpperCase()}:\n${m.content}`),
      "ASSISTANT:\n",
    ].join("\n\n");

    const genAI = new GoogleGenerativeAI(getEnv("GEMINI_API_KEY"));
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";

    return res.status(200).json({ content: text });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "AI failed";
    return res.status(500).json({ error: msg });
  }
}

