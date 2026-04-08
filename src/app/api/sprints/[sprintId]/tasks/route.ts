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
    .select("*, module_tasks(task_number, section)")
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
  const { moduleTaskIds } = body as { moduleTaskIds: string[] };

  if (!Array.isArray(moduleTaskIds) || moduleTaskIds.length === 0) {
    return NextResponse.json({ error: "moduleTaskIds array obrigatório" }, { status: 400 });
  }

  // Fetch module tasks to get their names/descriptions
  const { data: moduleTasks, error: fetchError } = await supabase
    .from("module_tasks")
    .select("id, name, description")
    .in("id", moduleTaskIds);

  if (fetchError || !moduleTasks) {
    return NextResponse.json({ error: "Erro ao buscar tarefas do módulo" }, { status: 500 });
  }

  const rows = moduleTasks.map((mt, idx) => ({
    sprint_id: sprintId,
    module_task_id: mt.id,
    name: mt.name,
    description: mt.description ?? null,
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
