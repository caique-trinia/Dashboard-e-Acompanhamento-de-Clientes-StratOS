import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "stratos-settings.json");

export interface SystemSettings {
  geminiModel: string;
}

const DEFAULTS: SystemSettings = {
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
};

export function readSettings(): SystemSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
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

export const AVAILABLE_MODELS: { value: string; label: string; description: string }[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Padrão — rápido e equilibrado" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Mais capaz, respostas mais elaboradas" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Muito rápido, menor custo" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Versão estável anterior" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Versão pro estável anterior" },
];
