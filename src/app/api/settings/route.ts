import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSettings, writeSettings, AVAILABLE_MODELS } from "@/lib/settings";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const settings = readSettings();
  const groqConfigured = !!process.env.GROQ_API_KEY;
  const geminiConfigured = !!process.env.GEMINI_API_KEY;

  const profile = {
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  };

  return NextResponse.json({ settings, availableModels: AVAILABLE_MODELS, groqConfigured, geminiConfigured, profile });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { aiModel } = body;

  const valid = AVAILABLE_MODELS.map((m) => m.value);
  if (!aiModel || !valid.includes(aiModel)) {
    return NextResponse.json({ error: "Modelo inválido" }, { status: 400 });
  }

  const updated = writeSettings({ aiModel });
  return NextResponse.json({ settings: updated });
}
