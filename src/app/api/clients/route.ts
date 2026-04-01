import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, context_notes, asana_project_id, asana_project_name } = body;

  if (!name || !asana_project_id) {
    return NextResponse.json({ error: "name e asana_project_id são obrigatórios" }, { status: 400 });
  }

  const slug = slugify(name);
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      slug,
      context_notes: context_notes ?? null,
      asana_project_id,
      asana_project_name: asana_project_name ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe um cliente com este nome." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
