import { asanaFetch } from "./client";
import type { AsanaTask, AsanaStory, CreateTaskParams } from "@/types/asana";
import { sleep } from "@/lib/utils";

const ASANA_RATE_LIMIT_DELAY_MS = 500;

export async function getProjectTasks(
  projectGid: string,
  opts?: { completedSince?: string }
): Promise<AsanaTask[]> {
  const params = new URLSearchParams({
    project: projectGid,
    opt_fields:
      "gid,name,completed,due_on,notes,memberships.project.gid,memberships.section.gid,memberships.section.name,assignee.gid,assignee.name,modified_at",
    limit: "100",
  });
  if (opts?.completedSince) {
    params.set("completed_since", opts.completedSince);
  }

  return asanaFetch<AsanaTask[]>(`/tasks?${params.toString()}`);
}

export async function getTask(taskGid: string): Promise<AsanaTask> {
  return asanaFetch<AsanaTask>(
    `/tasks/${taskGid}?opt_fields=gid,name,completed,due_on,notes,memberships.section.gid,memberships.section.name,assignee.gid,assignee.name`
  );
}

export async function createTask(params: CreateTaskParams): Promise<{ gid: string }> {
  const body: Record<string, unknown> = {
    data: {
      name: params.name,
      notes: params.notes ?? "",
      projects: [params.projectGid],
      ...(params.dueOn ? { due_on: params.dueOn } : {}),
      ...(params.assigneeGid ? { assignee: params.assigneeGid } : {}),
    },
  };

  const task = await asanaFetch<{ gid: string }>("/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Move to specific section if provided
  if (params.sectionGid) {
    await sleep(ASANA_RATE_LIMIT_DELAY_MS);
    await moveTaskToSection(task.gid, params.sectionGid);
  }

  return task;
}

export async function moveTaskToSection(
  taskGid: string,
  sectionGid: string
): Promise<void> {
  await asanaFetch<unknown>(`/sections/${sectionGid}/addTask`, {
    method: "POST",
    body: JSON.stringify({ data: { task: taskGid } }),
  });
}

export async function getTaskStories(taskGid: string): Promise<AsanaStory[]> {
  const stories = await asanaFetch<AsanaStory[]>(
    `/tasks/${taskGid}/stories?opt_fields=gid,created_at,type,text,created_by.gid,created_by.name`
  );
  // Return only comment stories (not system stories)
  return stories.filter((s) => s.type === "comment");
}
