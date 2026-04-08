import { asanaFetch } from "./client";
import type { AsanaProject, AsanaSection } from "@/types/asana";

export async function getProjects(): Promise<AsanaProject[]> {
  const workspaceGid = process.env.ASANA_WORKSPACE_GID;
  if (!workspaceGid) {
    throw new Error("ASANA_WORKSPACE_GID não configurado");
  }

  return asanaFetch<AsanaProject[]>(
    `/projects?workspace=${workspaceGid}&opt_fields=gid,name&limit=100`
  );
}

export async function getProjectSections(projectGid: string): Promise<AsanaSection[]> {
  return asanaFetch<AsanaSection[]>(
    `/projects/${projectGid}/sections?opt_fields=gid,name`
  );
}
