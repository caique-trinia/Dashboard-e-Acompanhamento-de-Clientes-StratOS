import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { sprintId } = await params;
  const { data, error } = await supabase
    .from("sprint_tasks")
    .select("*")
    .eq("sprint_id", sprintId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { sprintId } = await params;
  const body = await req.json();
  const { tasks } = body as { tasks: { name: string; description?: string }[] };

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: "tasks array obrigatório" }, { status: 400 });
  }

  const rows = tasks.map((t, idx) => ({
    sprint_id: sprintId,
    name: t.name,
    description: t.description ?? null,
    status: "pending" as const,
    sort_order: idx,
  }));

  const { data, error } = await supabase
    .from("sprint_tasks")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
