import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectTasks } from "@/lib/asana/tasks";
import { generateJson } from "@/lib/ai/gemini";
import { buildSuggestTasksPrompt } from "@/lib/ai/prompts";
import type { SuggestTasksResponse } from "@/types/ai";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { clientId, libraryId } = body;
  if (!clientId || !libraryId) {
    return NextResponse.json({ error: "clientId e libraryId são obrigatórios" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  // Get sprint tasks already added (to exclude from suggestions)
  const { data: existingSprintTasks } = await supabase
    .from("sprint_tasks")
    .select("module_task_id")
    .not("module_task_id", "is", null);

  const excludedIds = new Set((existingSprintTasks ?? []).map((t) => t.module_task_id));

  // Get available module tasks
  const { data: moduleTasks } = await supabase
    .from("module_tasks")
    .select("*")
    .eq("library_id", libraryId)
    .order("sort_order");

  const availableTasks = (moduleTasks ?? []).filter((t) => !excludedIds.has(t.id));

  // Get recent Asana tasks
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 30);
  const asanaTasks = await getProjectTasks(client.asana_project_id, {
    completedSince: recentCutoff.toISOString(),
  }).catch(() => []);

  const prompt = buildSuggestTasksPrompt(
    client.name,
    client.context_notes,
    asanaTasks,
    availableTasks
  );

  let result: SuggestTasksResponse;
  try {
    result = await generateJson<SuggestTasksResponse>(prompt);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Log the suggestion action
  await supabase.from("ai_audit_log").insert({
    client_id: clientId,
    action_type: "sprint_suggestion",
    triggered_by: "manual",
    actor_user_id: user.id,
    prompt_summary: prompt.slice(0, 500),
    ai_response_summary: JSON.stringify(result).slice(0, 500),
    success: true,
    metadata: { suggestionCount: result.suggestions.length },
  });

  return NextResponse.json(result);
}
