import { asanaFetch } from "./client";
import type { AsanaProject, AsanaSection } from "@/types/asana";

export async function getProjects(workspaceGid?: string): Promise<AsanaProject[]> {
  const gid = workspaceGid ?? process.env.ASANA_WORKSPACE_GID;
  if (!gid) {
    throw new Error("ASANA_WORKSPACE_GID não configurado");
  }

  return asanaFetch<AsanaProject[]>(
    `/projects?workspace=${gid}&opt_fields=gid,name&limit=100`
  );
}

export async function getProjectSections(projectGid: string): Promise<AsanaSection[]> {
  return asanaFetch<AsanaSection[]>(
    `/projects/${projectGid}/sections?opt_fields=gid,name`
  );
}
