import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "stratos-settings.json");

export interface SystemSettings {
  aiModel: string;
}

const DEFAULTS: SystemSettings = {
  aiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
};

export function readSettings(): SystemSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    // backwards compat: migrate old geminiModel key
    if (parsed.geminiModel && !parsed.aiModel) {
      parsed.aiModel = parsed.geminiModel;
      delete parsed.geminiModel;
    }
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSettings(patch: Partial<SystemSettings>): SystemSettings {
  const current = readSettings();
  const updated = { ...current, ...patch };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export type ModelProvider = "gemini" | "groq";

export interface AvailableModel {
  value: string;
  label: string;
  description: string;
  provider: ModelProvider;
  requiresKey: string;
}

export const AVAILABLE_MODELS: AvailableModel[] = [
  // Gemini
  { value: "gemini-2.5-flash",      label: "Gemini 2.5 Flash",          description: "Padrão — rápido e equilibrado",          provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  { value: "gemini-2.5-pro",        label: "Gemini 2.5 Pro",            description: "Mais capaz, respostas mais elaboradas",  provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite",     description: "Ultra-leve e rápido — menor custo",      provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite",     description: "Mais novo — ultra-leve geração 3.1",     provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  { value: "gemini-2.0-flash",      label: "Gemini 2.0 Flash",          description: "Muito rápido, menor custo",              provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  { value: "gemini-1.5-flash",      label: "Gemini 1.5 Flash",          description: "Versão estável anterior",                provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  { value: "gemini-1.5-pro",        label: "Gemini 1.5 Pro",            description: "Versão pro estável anterior",            provider: "gemini", requiresKey: "GEMINI_API_KEY" },
  // Groq
  { value: "groq:llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", description: "Muito capaz, ultra-rápido via Groq",    provider: "groq", requiresKey: "GROQ_API_KEY" },
  { value: "groq:llama-3.1-8b-instant",    label: "Llama 3.1 8B Instant (Groq)", description: "Extremamente rápido e leve",  provider: "groq", requiresKey: "GROQ_API_KEY" },
  { value: "groq:mixtral-8x7b-32768",      label: "Mixtral 8x7B (Groq)",  description: "Contexto longo, excelente raciocínio", provider: "groq", requiresKey: "GROQ_API_KEY" },
  { value: "groq:gemma2-9b-it",            label: "Gemma 2 9B (Groq)",    description: "Modelo Google rodando via Groq",       provider: "groq", requiresKey: "GROQ_API_KEY" },
];

export function getModelProvider(modelValue: string): ModelProvider {
  return modelValue.startsWith("groq:") ? "groq" : "gemini";
}

export function getModelId(modelValue: string): string {
  return modelValue.startsWith("groq:") ? modelValue.slice(5) : modelValue;
}
