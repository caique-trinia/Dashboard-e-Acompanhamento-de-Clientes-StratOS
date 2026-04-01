import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTask, getProjectTasks } from "@/lib/asana/tasks";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId obrigatório" }, { status: 400 });

  try {
    const tasks = await getProjectTasks(projectId);
    return NextResponse.json(tasks);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { projectGid, name, notes, sectionGid, dueOn } = body;

  if (!projectGid || !name) {
    return NextResponse.json({ error: "projectGid e name são obrigatórios" }, { status: 400 });
  }

  try {
    const task = await createTask({ projectGid, name, notes, sectionGid, dueOn });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
