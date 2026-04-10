import { GoogleGenerativeAI } from "@google/generative-ai";
import { readSettings, getModelProvider, getModelId } from "@/lib/settings";
import { sleep } from "@/lib/utils";

// ── Gemini ────────────────────────────────────────────────────────────────────

let _geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!_geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurado");
    _geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return _geminiClient;
}

/** Returns true for errors that are worth retrying (rate limit, overload) */
function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("Too Many Requests") ||
    msg.includes("Service Unavailable") ||
    msg.includes("overloaded")
  );
}

/**
 * Extract JSON from a model response that may include markdown code fences.
 * Supports: raw JSON, ```json ... ```, ``` ... ```
 */
function extractJson<T>(text: string): T {
  // Try direct parse first
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Strip markdown code fences
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as T;
      } catch {
        // fall through
      }
    }
    // Last resort: find first [ or { and last ] or }
    const start = trimmed.search(/[\[{]/);
    const lastBracket = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
    if (start !== -1 && lastBracket > start) {
      try {
        return JSON.parse(trimmed.slice(start, lastBracket + 1)) as T;
      } catch {
        // fall through
      }
    }
    throw new Error(`JSON inválido na resposta do modelo: ${trimmed.slice(0, 300)}`);
  }
}

async function generateWithGemini<T>(modelId: string, prompt: string): Promise<T> {
  // NOTE: responseMimeType:"application/json" is NOT supported by all Gemini models.
  // We rely on the prompt explicitly requesting JSON and extract it from the text.
  const model = getGeminiClient().getGenerativeModel({ model: modelId });

  const delays = [2000, 4000, 8000]; // 3 retries with exponential backoff
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return extractJson<T>(text);
    } catch (err) {
      lastError = err;
      if (attempt < delays.length && isRetryable(err)) {
        await sleep(delays[attempt]);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// ── Groq ──────────────────────────────────────────────────────────────────────

async function generateWithGroq<T>(modelId: string, prompt: string): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY não configurado no .env.local");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Groq retornou JSON inválido: ${text.slice(0, 300)}`);
  }
}

// ── Unified entrypoint ────────────────────────────────────────────────────────

export async function generateJson<T>(prompt: string): Promise<T> {
  const { aiModel } = readSettings();
  const provider = getModelProvider(aiModel);
  const modelId = getModelId(aiModel);

  if (provider === "groq") {
    return generateWithGroq<T>(modelId, prompt);
  }
  return generateWithGemini<T>(modelId, prompt);
}

/** @deprecated use generateJson directly */
export function getFlashModel() {
  const { aiModel } = readSettings();
  const modelId = getModelId(aiModel);
  return getGeminiClient().getGenerativeModel({
    model: modelId,
    generationConfig: { responseMimeType: "application/json" },
  });
}
