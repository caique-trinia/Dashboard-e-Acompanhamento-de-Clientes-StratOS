import { createServiceClient } from "@/lib/supabase/server";
import { getProjectTasks, getTaskStories, moveTaskToSection } from "@/lib/asana/tasks";
import { getProjectSections } from "@/lib/asana/projects";
import { addComment } from "@/lib/asana/comments";
import { generateJson } from "@/lib/ai/gemini";
import { buildFollowUpPrompt, buildHealthPrompt } from "@/lib/ai/prompts";
import { sleep } from "@/lib/utils";
import type { Client } from "@/types/database";
import type { FollowUpAction, HealthAnalysisResponse } from "@/types/ai";

const RATE_LIMIT_DELAY = 500;

async function runFollowUpForProject(
  client: Client,
  projectGid: string,
  projectName: string,
  triggeredBy: "cron" | "manual" | "user",
  meetingContext: string | null,
  activeSprint: { id: string; name: string; goal: string | null; start_date: string | null; end_date: string | null } | null,
  openActionItems: { description: string; assignee: string | null; due_date: string | null }[]
): Promise<{ actionsExecuted: number; errors: string[] }> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let actionsExecuted = 0;

  const [sections, tasks] = await Promise.all([
    getProjectSections(projectGid),
    getProjectTasks(projectGid),
  ]);

  await sleep(RATE_LIMIT_DELAY);

  // Fetch recent stories for active tasks
  const activeTasks = tasks.filter((t) => !t.completed).slice(0, 10);
  const allComments: { taskName: string; text: string; author: string; date: string }[] = [];

  for (const task of activeTasks) {
    try {
      const stories = await getTaskStories(task.gid);
      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - 7);
      const recent = stories.filter((s) => new Date(s.created_at) > recentCutoff);
      for (const story of recent) {
        allComments.push({
          taskName: task.name,
          text: story.text.slice(0, 200),
          author: story.created_by.name,
          date: story.created_at.slice(0, 10),
        });
      }
      await sleep(RATE_LIMIT_DELAY);
    } catch {
      // Skip if stories fetch fails for a task
    }
  }

  const promptContext = {
    clientName: `${client.name} — ${projectName}`,
    clientContextNotes: client.context_notes,
    asanaTasks: tasks.map((t) => ({
      gid: t.gid,
      name: t.name,
      completed: t.completed,
      section_name: t.memberships?.[0]?.section?.name ?? null,
      due_on: t.due_on,
      notes: t.notes?.slice(0, 200) ?? "",
    })),
    recentComments: allComments.slice(0, 20),
    meetingContext,
    sections,
    activeSprint,
    openActionItems,
  };

  const prompt = buildFollowUpPrompt(promptContext);
  const actions = await generateJson<FollowUpAction[]>(prompt);

  for (const action of actions) {
    try {
      if (action.type === "comment") {
        await addComment(action.taskGid, action.text);
        await supabase.from("ai_audit_log").insert({
          client_id: client.id,
          action_type: "follow_up_comment",
          triggered_by: triggeredBy,
          prompt_summary: prompt.slice(0, 500),
          ai_response_summary: JSON.stringify(actions).slice(0, 500),
          asana_task_id: action.taskGid,
          asana_action: { type: "comment", text: action.text, projectGid },
          success: true,
        });
        actionsExecuted++;
        await sleep(RATE_LIMIT_DELAY);
      } else if (action.type === "move") {
        await moveTaskToSection(action.taskGid, action.toSectionGid);
        await supabase.from("ai_audit_log").insert({
          client_id: client.id,
          action_type: "task_moved",
          triggered_by: triggeredBy,
          prompt_summary: prompt.slice(0, 500),
          ai_response_summary: JSON.stringify(actions).slice(0, 500),
          asana_task_id: action.taskGid,
          asana_action: { type: "move", toSectionGid: action.toSectionGid, projectGid },
          success: true,
        });
        actionsExecuted++;
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (err) {
      const msg = (err as Error).message;
      errors.push(`Ação ${action.type} (${projectName}): ${msg}`);
      await supabase.from("ai_audit_log").insert({
        client_id: client.id,
        action_type: action.type === "comment" ? "follow_up_comment" : "task_moved",
        triggered_by: triggeredBy,
        asana_task_id: "taskGid" in action ? action.taskGid : null,
        success: false,
        error_message: msg,
      });
    }
  }

  return { actionsExecuted, errors };
}

export async function runFollowUpForClient(
  client: Client,
  triggeredBy: "cron" | "manual" | "user" = "cron"
): Promise<{
  actionsExecuted: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let actionsExecuted = 0;

  try {
    // Fetch all projects for this client
    const { data: projects } = await supabase
      .from("client_asana_projects")
      .select("project_gid, project_name")
      .eq("client_id", client.id)
      .order("sort_order");

    // Fall back to the legacy asana_project_id if no projects in new table
    const projectList =
      projects && projects.length > 0
        ? projects
        : client.asana_project_id
        ? [{ project_gid: client.asana_project_id, project_name: client.asana_project_name ?? client.asana_project_id }]
        : [];

    if (projectList.length === 0) {
      errors.push(`Cliente ${client.name} não possui projetos Asana configurados.`);
      return { actionsExecuted, errors };
    }

    // Fetch shared context (meetings + sprint) once for all projects
    const { data: meetingNotes } = await supabase
      .from("meeting_notes")
      .select("title, content, meeting_type, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(3);

    const meetingContext =
      meetingNotes && meetingNotes.length > 0
        ? meetingNotes
            .map((m, i) => {
              const label = i === 0 ? "ÚLTIMA REUNIÃO" : `REUNIÃO ANTERIOR ${i}`;
              const type = m.meeting_type ? ` (${m.meeting_type})` : "";
              const date = m.created_at.slice(0, 10);
              return `${label}${type} – ${date}:\n${m.content}`;
            })
            .join("\n\n---\n\n")
        : null;

    const { data: activeSprints } = await supabase
      .from("sprints")
      .select("id, name, goal, start_date, end_date, status")
      .eq("client_id", client.id)
      .eq("status", "active")
      .limit(1);

    const activeSprint = activeSprints?.[0] ?? null;

    let openActionItems: { description: string; assignee: string | null; due_date: string | null }[] = [];
    if (meetingNotes && meetingNotes.length > 0) {
      const { data: meetingIds } = await supabase
        .from("meeting_notes")
        .select("id")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (meetingIds && meetingIds.length > 0) {
        const ids = meetingIds.map((m) => m.id);
        const { data: items } = await supabase
          .from("meeting_action_items")
          .select("description, assignee, due_date")
          .in("meeting_id", ids)
          .eq("done", false)
          .order("created_at");
        openActionItems = items ?? [];
      }
    }

    // Run follow-up for each project (sequential to respect rate limits)
    const results = await Promise.allSettled(
      projectList.map((p) =>
        runFollowUpForProject(
          client,
          p.project_gid,
          p.project_name,
          triggeredBy,
          meetingContext,
          activeSprint,
          openActionItems
        )
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        actionsExecuted += result.value.actionsExecuted;
        errors.push(...result.value.errors);
      } else {
        errors.push(String(result.reason));
      }
    }
  } catch (err) {
    const msg = (err as Error).message;
    errors.push(`Erro geral do cliente ${client.name}: ${msg}`);
    await supabase.from("ai_audit_log").insert({
      client_id: client.id,
      action_type: "cron_run_failed",
      triggered_by: triggeredBy,
      success: false,
      error_message: msg,
    });
  }

  return { actionsExecuted, errors };
}

export async function runHealthAnalysis(client: Client): Promise<void> {
  const supabase = createServiceClient();

  try {
    // Use the first project for health analysis
    const { data: projects } = await supabase
      .from("client_asana_projects")
      .select("project_gid")
      .eq("client_id", client.id)
      .order("sort_order")
      .limit(1);

    const projectGid = projects?.[0]?.project_gid ?? client.asana_project_id;
    if (!projectGid) return;

    const tasks = await getProjectTasks(projectGid);
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionPct =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.due_on && new Date(t.due_on) < now
    ).length;

    const staleTasks = tasks.filter(
      (t) => !t.completed && new Date(t.modified_at) < staleCutoff
    ).length;

    const blockedTasks = tasks.filter((t) =>
      t.memberships?.some(
        (m) =>
          m.section?.name?.toLowerCase().includes("bloqueado") ||
          m.section?.name?.toLowerCase().includes("blocked")
      )
    ).length;

    const recentComments: string[] = [];
    for (const task of tasks.filter((t) => !t.completed).slice(0, 5)) {
      try {
        const stories = await getTaskStories(task.gid);
        const latest = stories.slice(0, 2);
        for (const s of latest) {
          recentComments.push(`"${task.name}": ${s.text.slice(0, 150)}`);
        }
        await sleep(RATE_LIMIT_DELAY);
      } catch {
        // ignore
      }
    }

    const prompt = buildHealthPrompt({
      clientName: client.name,
      clientContextNotes: client.context_notes,
      totalTasks,
      completedTasks,
      completionPct,
      overdueTasks,
      staleCount: staleTasks,
      blockedCount: blockedTasks,
      comments: recentComments,
    });

    const result = await generateJson<HealthAnalysisResponse>(prompt);

    await supabase
      .from("clients")
      .update({
        health_score: Math.max(0, Math.min(100, result.score)),
        health_summary: result.summary,
        health_updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    await supabase.from("ai_audit_log").insert({
      client_id: client.id,
      action_type: "health_analysis",
      triggered_by: "cron",
      prompt_summary: prompt.slice(0, 500),
      ai_response_summary: JSON.stringify(result).slice(0, 500),
      success: true,
      metadata: { score: result.score, risks: result.risks, positives: result.positives },
    });
  } catch (err) {
    const msg = (err as Error).message;
    await supabase.from("ai_audit_log").insert({
      client_id: client.id,
      action_type: "health_analysis",
      triggered_by: "cron",
      success: false,
      error_message: msg,
    });
  }
}
