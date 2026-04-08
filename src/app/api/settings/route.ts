import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSettings, writeSettings, AVAILABLE_MODELS } from "@/lib/settings";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  return NextResponse.json({ settings: readSettings(), availableModels: AVAILABLE_MODELS });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { geminiModel } = body;

  const valid = AVAILABLE_MODELS.map((m) => m.value);
  if (geminiModel && !valid.includes(geminiModel)) {
    return NextResponse.json({ error: "Modelo inválido" }, { status: 400 });
  }

  const updated = writeSettings({ ...(geminiModel && { geminiModel }) });
  return NextResponse.json({ settings: updated });
}
