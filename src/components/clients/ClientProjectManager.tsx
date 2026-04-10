"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AsanaProjectPicker } from "@/components/clients/AsanaProjectPicker";
import { Loader2, Plus, Trash2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ClientAsanaProject } from "@/types/database";

interface ClientProjectManagerProps {
  clientId: string;
  workspaceId: string | null;
  onProjectsChange?: () => void;
}

export function ClientProjectManager({ clientId, workspaceId, onProjectsChange }: ClientProjectManagerProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ClientAsanaProject[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedGid, setSelectedGid] = useState<string>("");
  const [selectedName, setSelectedName] = useState<string>("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchProjects() {
    const res = await fetch(`/api/clients/${clientId}/projects`);
    const data = await res.json();
    if (Array.isArray(data)) setProjects(data);
  }

  async function handleAdd() {
    if (!selectedGid || !selectedName) return;
    setAdding(true);
    const res = await fetch(`/api/clients/${clientId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_gid: selectedGid, project_name: selectedName }),
    });
    setAdding(false);
    if (res.ok) {
      toast({ title: "Projeto adicionado!" });
      setSelectedGid("");
      setSelectedName("");
      fetchProjects();
      onProjectsChange?.();
    } else {
      const data = await res.json();
      toast({ title: data.error ?? "Erro ao adicionar projeto", variant: "destructive" });
    }
  }

  async function handleDelete(project: ClientAsanaProject) {
    if (!window.confirm(`Remover o projeto "${project.project_name}" deste cliente?`)) return;
    const res = await fetch(`/api/clients/${clientId}/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Projeto removido." });
      fetchProjects();
      onProjectsChange?.();
    } else {
      const data = await res.json();
      toast({ title: data.error ?? "Erro ao remover projeto", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen className="h-4 w-4 mr-1" />
          Projetos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Projetos Asana vinculados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current projects */}
          <div className="space-y-1">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                <span className="flex-1 truncate">{p.project_name}</span>
                <button
                  onClick={() => handleDelete(p)}
                  className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remover projeto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-slate-400">Nenhum projeto vinculado.</p>
            )}
          </div>

          {/* Add new project */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-slate-500">Adicionar projeto</p>
            <AsanaProjectPicker
              value={selectedGid || undefined}
              workspaceId={workspaceId ?? undefined}
              onSelect={(gid, name) => { setSelectedGid(gid); setSelectedName(name); }}
            />
            <Button
              size="sm"
              className="w-full"
              onClick={handleAdd}
              disabled={adding || !selectedGid}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
