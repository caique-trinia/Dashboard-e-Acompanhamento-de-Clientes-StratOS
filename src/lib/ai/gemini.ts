import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurado");
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

export function getFlashModel() {
  return getGeminiClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}

export async function generateJson<T>(
  prompt: string,
  fallback: T
): Promise<T> {
  const model = getFlashModel();
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[Gemini] Erro ao gerar ou parsear JSON:", err);
    return fallback;
  }
}
