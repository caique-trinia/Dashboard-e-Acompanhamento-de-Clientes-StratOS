import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId obrigatório" }, { status: 400 });

  const { data, error } = await supabase
    .from("sprints")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { client_id, name, goal, start_date, end_date, meeting_context, asana_section_id } = body;

  if (!client_id || !name) {
    return NextResponse.json({ error: "client_id e name são obrigatórios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sprints")
    .insert({
      client_id,
      name,
      goal: goal ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      meeting_context: meeting_context ?? null,
      asana_section_id: asana_section_id ?? null,
      created_by: user.id,
      status: "planning",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
