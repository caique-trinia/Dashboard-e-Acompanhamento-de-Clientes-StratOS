import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/lib/asana/tasks";
import { sleep } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { sprintId } = await params;
  const body = await req.json().catch(() => ({}));
  const { sectionGid } = body;

  // Fetch sprint + client
  const { data: sprint } = await supabase
    .from("sprints")
    .select("*, clients(id, asana_project_id)")
    .eq("id", sprintId)
    .single();

  if (!sprint) return NextResponse.json({ error: "Sprint não encontrada" }, { status: 404 });

  const client = sprint.clients as { id: string; asana_project_id: string };

  // Fetch unpushed tasks
  const { data: tasks } = await supabase
    .from("sprint_tasks")
    .select("*")
    .eq("sprint_id", sprintId)
    .is("asana_task_id", null);

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ pushed: 0, message: "Sem tarefas para empurrar" });
  }

  let pushed = 0;
  const errors: string[] = [];

  for (const task of tasks) {
    try {
      const asanaTask = await createTask({
        projectGid: client.asana_project_id,
        name: task.name,
        notes: task.description ?? "",
        sectionGid: sectionGid ?? sprint.asana_section_id ?? undefined,
      });

      await supabase
        .from("sprint_tasks")
        .update({ asana_task_id: asanaTask.gid, status: "pushed" })
        .eq("id", task.id);

      await supabase.from("ai_audit_log").insert({
        client_id: client.id,
        sprint_id: sprintId,
        action_type: "task_created",
        triggered_by: "user",
        actor_user_id: user.id,
        asana_task_id: asanaTask.gid,
        asana_action: { type: "create", name: task.name },
        success: true,
      });

      pushed++;
      await sleep(500);
    } catch (err) {
      errors.push(`"${task.name}": ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ pushed, errors });
}
