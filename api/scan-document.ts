import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not configured`);
  return v;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text } = (req.body ?? {}) as { text?: unknown };
    if (typeof text !== "string" || text.trim().length === 0) {
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

    const genAI = new GoogleGenerativeAI(getEnv("GEMINI_API_KEY"));
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result?.response?.text?.() ?? "";

    return res.status(200).json({ content: responseText });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "AI failed";
    return res.status(500).json({ error: msg });
  }
}

