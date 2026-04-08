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

export async function generateJson<T>(prompt: string): Promise<T> {
  const model = getFlashModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Gemini retornou JSON inválido: ${text.slice(0, 300)}`);
  }
}
