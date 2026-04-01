"use client";

import { useState, useEffect, use } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleTree } from "@/components/modules/ModuleTree";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Send, Bot } from "lucide-react";
import type { Sprint, SprintTask, ModuleTask, ModuleLibrary } from "@/types/database";

export default function SprintPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const { toast } = useToast();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [sprintTasks, setSprintTasks] = useState<SprintTask[]>([]);
  const [libraries, setLibraries] = useState<ModuleLibrary[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [moduleTasks, setModuleTasks] = useState<ModuleTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");

  useEffect(() => {
    fetchSprints();
    fetchLibraries();
  }, [clientId]);

  useEffect(() => {
    if (selectedLibrary) fetchModuleTasks(selectedLibrary);
  }, [selectedLibrary]);

  async function fetchSprints() {
    const res = await fetch(`/api/sprints?clientId=${clientId}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setSprints(data);
      const active = data.find((s: Sprint) => s.status === "active");
      setActiveSprint(active ?? data[0] ?? null);
      if (active ?? data[0]) fetchSprintTasks((active ?? data[0]).id);
    }
  }

  async function fetchSprintTasks(sprintId: string) {
    const res = await fetch(`/api/sprints/${sprintId}/tasks`);
    const data = await res.json();
    if (Array.isArray(data)) setSprintTasks(data);
  }

  async function fetchLibraries() {
    const res = await fetch("/api/modules");
    const data = await res.json();
    if (Array.isArray(data)) {
      setLibraries(data);
      if (data.length > 0) setSelectedLibrary(data[0].id);
    }
  }

  async function fetchModuleTasks(libraryId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("module_tasks")
      .select("*")
      .eq("library_id", libraryId)
      .order("sort_order");
    if (data) setModuleTasks(data as ModuleTask[]);
  }

  async function createSprint() {
    if (!newSprintName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, name: newSprintName, status: "active" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Sprint criada!" });
      setShowNewSprint(false);
      setNewSprintName("");
      fetchSprints();
    }
  }

  async function addSelectedTasksToSprint() {
    if (!activeSprint || selectedTaskIds.size === 0) return;
    setLoading(true);
    const res = await fetch(`/api/sprints/${activeSprint.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleTaskIds: Array.from(selectedTaskIds) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      toast({ title: `${selectedTaskIds.size} tarefa(s) adicionadas à sprint!` });
      setSelectedTaskIds(new Set());
      fetchSprintTasks(activeSprint.id);
    }
  }

  async function pushToAsana() {
    if (!activeSprint) return;
    setLoading(true);
    const res = await fetch(`/api/sprints/${activeSprint.id}/push-to-asana`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro ao empurrar para Asana", description: data.error, variant: "destructive" });
    } else {
      toast({ title: `${data.pushed} tarefa(s) criadas no Asana!` });
      fetchSprintTasks(activeSprint.id);
    }
  }

  async function getSuggestions() {
    if (!selectedLibrary) return;
    setLoading(true);
    const res = await fetch("/api/ai/suggest-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, libraryId: selectedLibrary }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      const suggestedIds = data.suggestions.map((s: { moduleTaskId: string }) => s.moduleTaskId);
      setSelectedTaskIds(new Set(suggestedIds));
      toast({
        title: `IA sugeriu ${data.suggestions.length} tarefas`,
        description: data.sprintFocusSummary?.slice(0, 100),
      });
    }
  }

  const statusColors: Record<string, "outline" | "info" | "warning" | "success"> = {
    pending: "outline",
    pushed: "info",
    in_progress: "warning",
    completed: "success",
  };

  return (
    <div>
      <Topbar title="Gerenciar Sprint" subtitle="Selecione tarefas do módulo e empurre para o Asana" />
      <div className="p-6 space-y-6">
        {/* Sprint selector */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sprint Ativa</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowNewSprint(!showNewSprint)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Sprint
            </Button>
          </CardHeader>
          <CardContent>
            {showNewSprint && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="Nome da sprint, ex: Sprint 1 - Abril 2026"
                  onKeyDown={(e) => e.key === "Enter" && createSprint()}
                />
                <Button onClick={createSprint} disabled={loading}>Criar</Button>
              </div>
            )}
            {activeSprint ? (
              <div className="flex items-center gap-3">
                <Badge variant="success">Ativa</Badge>
                <span className="font-medium">{activeSprint.name}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Nenhuma sprint ativa. Crie uma acima.</p>
            )}
          </CardContent>
        </Card>

        {activeSprint && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module task selector */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Tarefas do Módulo</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={getSuggestions} disabled={loading || !selectedLibrary}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                      <span className="ml-1">IA Sugere</span>
                    </Button>
                    <Button size="sm" onClick={addSelectedTasksToSprint} disabled={selectedTaskIds.size === 0 || loading}>
                      Adicionar ({selectedTaskIds.size})
                    </Button>
                  </div>
                </div>
                {libraries.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {libraries.map((lib) => (
                      <button
                        key={lib.id}
                        onClick={() => setSelectedLibrary(lib.id)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          selectedLibrary === lib.id
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {lib.name}
                      </button>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ModuleTree
                  tasks={moduleTasks}
                  selectedIds={selectedTaskIds}
                  selectable
                  onToggle={(id) => {
                    setSelectedTaskIds((prev) => {
                      const next = new Set(prev);
                      next.has(id) ? next.delete(id) : next.add(id);
                      return next;
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Sprint task list */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Tarefas na Sprint ({sprintTasks.length})
                </CardTitle>
                <Button size="sm" onClick={pushToAsana} disabled={loading || sprintTasks.filter(t => !t.asana_task_id).length === 0}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-1">Enviar para Asana</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {sprintTasks.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">
                    Selecione tarefas do módulo ao lado e clique em Adicionar.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-auto">
                    {sprintTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                        <Badge variant={statusColors[task.status] ?? "outline"} className="text-xs flex-shrink-0">
                          {task.status}
                        </Badge>
                        <span className="text-sm flex-1 truncate">{task.name}</span>
                        {task.asana_task_id && (
                          <span className="text-xs text-slate-400 flex-shrink-0">Asana ✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
