"use client";

import { useEffect, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { AsanaProject } from "@/types/asana";

interface AsanaProjectPickerProps {
  value?: string;
  onSelect: (gid: string, name: string) => void;
}

export function AsanaProjectPicker({ value, onSelect }: AsanaProjectPickerProps) {
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/asana/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
        else setError(data.error ?? "Erro ao carregar projetos");
      })
      .catch(() => setError("Falha ao conectar com a API"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando projetos Asana...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <Select
      value={value}
      onValueChange={(gid) => {
        const project = projects.find((p) => p.gid === gid);
        if (project) onSelect(project.gid, project.name);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione um projeto Asana" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.gid} value={p.gid}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
