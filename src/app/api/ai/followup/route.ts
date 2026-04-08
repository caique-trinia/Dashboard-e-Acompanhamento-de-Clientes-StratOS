import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFollowUpForClient } from "@/lib/ai/followup";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { clientId } = body;
  if (!clientId) return NextResponse.json({ error: "clientId obrigatório" }, { status: 400 });

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  // Override triggered_by to "manual" for this run by calling the lib directly
  const result = await runFollowUpForClient(client, "manual");
  return NextResponse.json(result);
}
