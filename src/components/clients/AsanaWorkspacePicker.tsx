"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { AsanaWorkspace } from "@/types/asana";

interface AsanaWorkspacePickerProps {
  value?: string;
  onSelect: (gid: string, name: string) => void;
}

export function AsanaWorkspacePicker({ value, onSelect }: AsanaWorkspacePickerProps) {
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/asana/workspaces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWorkspaces(data);
          // Auto-select if only one workspace and nothing selected yet
          if (data.length === 1 && !value) {
            onSelect(data[0].gid, data[0].name);
          }
        } else {
          setError(data.error ?? "Erro ao carregar workspaces");
        }
      })
      .catch(() => setError("Falha ao conectar com a API do Asana"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando workspaces...
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <Select
      value={value}
      onValueChange={(gid) => {
        const ws = workspaces.find((w) => w.gid === gid);
        if (ws) onSelect(ws.gid, ws.name);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione um workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((w) => (
          <SelectItem key={w.gid} value={w.gid}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
