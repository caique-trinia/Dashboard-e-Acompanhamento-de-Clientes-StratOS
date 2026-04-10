import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectTasks } from "@/lib/asana/tasks";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await params; // clientId available if needed for auth checks

  const projectGid = req.nextUrl.searchParams.get("projectGid");
  if (!projectGid) {
    return NextResponse.json({ error: "projectGid é obrigatório" }, { status: 400 });
  }

  try {
    const allTasks = await getProjectTasks(projectGid);

    // Compute current month range
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const todayStr = now.toISOString().slice(0, 10);

    const monthLabel = `${year}-${String(month + 1).padStart(2, "0")}`;

    // Filter tasks due this month (include tasks with no due_on only if completed this month)
    const monthTasks = allTasks.filter((t) => {
      if (!t.due_on) return false;
      return t.due_on >= startOfMonth && t.due_on <= endOfMonth;
    });

    // Group by assignee
    const assigneeMap = new Map<
      string,
      { assigneeGid: string; assigneeName: string; total: number; completed: number; overdue: number; tasks: typeof monthTasks }
    >();

    for (const task of monthTasks) {
      const gid = task.assignee?.gid ?? "__unassigned__";
      const name = task.assignee?.name ?? "Sem responsável";

      if (!assigneeMap.has(gid)) {
        assigneeMap.set(gid, { assigneeGid: gid, assigneeName: name, total: 0, completed: 0, overdue: 0, tasks: [] });
      }

      const entry = assigneeMap.get(gid)!;
      entry.total++;
      entry.tasks.push(task);
      if (task.completed) {
        entry.completed++;
      } else if (task.due_on && task.due_on < todayStr) {
        entry.overdue++;
      }
    }

    const byAssignee = Array.from(assigneeMap.values()).sort((a, b) => b.total - a.total);

    const totals = {
      total: monthTasks.length,
      completed: monthTasks.filter((t) => t.completed).length,
      overdue: monthTasks.filter((t) => !t.completed && t.due_on && t.due_on < todayStr).length,
    };

    return NextResponse.json({
      month: monthLabel,
      projectGid,
      totals,
      byAssignee,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
