"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ClientAsanaProject } from "@/types/database";

interface ClientProjectTabsProps {
  projects: ClientAsanaProject[];
  activeGid: string | null;
  clientId: string;
}

export function ClientProjectTabs({ projects, activeGid, clientId }: ClientProjectTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (projects.length === 0) return null;

  function handleSelect(gid: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", gid);
    router.push(`/clients/${clientId}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 flex-wrap border-b border-slate-200 pb-0">
      {projects.map((p) => {
        const isActive = p.project_gid === activeGid;
        return (
          <button
            key={p.id}
            onClick={() => handleSelect(p.project_gid)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={
              isActive
                ? { borderColor: "#f92e78", color: "#0a0b69" }
                : { borderColor: "transparent", color: "#64748b" }
            }
          >
            {p.project_name}
          </button>
        );
      })}
    </div>
  );
}
