import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { clientId } = await params;
  const { data, error } = await supabase
    .from("client_asana_projects")
    .select("*")
    .eq("client_id", clientId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { clientId } = await params;
  const body = await req.json();
  const { project_gid, project_name } = body as { project_gid: string; project_name: string };

  if (!project_gid || !project_name) {
    return NextResponse.json({ error: "project_gid e project_name são obrigatórios" }, { status: 400 });
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("client_asana_projects")
    .select("sort_order")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("client_asana_projects")
    .insert({ client_id: clientId, project_gid, project_name, sort_order: nextOrder })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este projeto já está vinculado ao cliente." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
