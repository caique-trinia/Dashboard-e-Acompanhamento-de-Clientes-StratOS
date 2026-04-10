"use client";

import { useState, useEffect, use } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Send, Play, CheckSquare, Calendar, Target, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Sprint, SprintTask } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativa",
  completed: "Concluída",
};

const STATUS_VARIANTS: Record<string, "outline" | "info" | "success" | "warning"> = {
  planning: "outline",
  active: "success",
  completed: "info",
};

const TASK_STATUS_VARIANTS: Record<string, "outline" | "info" | "warning" | "success"> = {
  pending: "outline",
  pushed: "info",
  in_progress: "warning",
  completed: "success",
};

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
  const [loading, setLoading] = useState(false);
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });
  const [newTaskName, setNewTaskName] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    fetchSprints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function fetchSprints() {
    const res = await fetch(`/api/sprints?clientId=${clientId}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setSprints(data);
      const active = data.find((s: Sprint) => s.status === "active");
      const selected = active ?? data[0] ?? null;
      setActiveSprint(selected);
      if (selected) fetchSprintTasks(selected.id);
    }
  }

  async function fetchSprintTasks(sprintId: string) {
    const res = await fetch(`/api/sprints/${sprintId}/tasks`);
    const data = await res.json();
    if (Array.isArray(data)) setSprintTasks(data);
  }

  async function createSprint() {
    if (!newSprint.name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        name: newSprint.name,
        goal: newSprint.goal || null,
        start_date: newSprint.start_date || null,
        end_date: newSprint.end_date || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Sprint criada!" });
      setShowNewSprint(false);
      setNewSprint({ name: "", goal: "", start_date: "", end_date: "" });
      fetchSprints();
    }
  }

  async function deleteSprint(sprint: Sprint) {
    if (!window.confirm(`Excluir a sprint "${sprint.name}"? Todas as tarefas vinculadas serão removidas.`)) return;
    const res = await fetch(`/api/sprints/${sprint.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Sprint excluída." });
      setSprints((prev) => prev.filter((s) => s.id !== sprint.id));
      if (activeSprint?.id === sprint.id) {
        setActiveSprint(null);
        setSprintTasks([]);
      }
    } else {
      toast({ title: "Erro ao excluir sprint", variant: "destructive" });
    }
  }

  async function deleteSprintTask(taskId: string) {
    if (!activeSprint) return;
    const res = await fetch(`/api/sprints/${activeSprint.id}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setSprintTasks((prev) => prev.filter((t) => t.id !== taskId));
    } else {
      toast({ title: "Erro ao remover tarefa", variant: "destructive" });
    }
  }

  async function updateSprintStatus(sprintId: string, status: "active" | "completed") {
    const res = await fetch(`/api/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: status === "active" ? "Sprint iniciada!" : "Sprint concluída!" });
      fetchSprints();
    }
  }

  async function selectSprint(sprint: Sprint) {
    setActiveSprint(sprint);
    fetchSprintTasks(sprint.id);
  }

  async function addManualTask(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSprint || !newTaskName.trim()) return;
    setAddingTask(true);
    const res = await fetch(`/api/sprints/${activeSprint.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: [{ name: newTaskName.trim() }] }),
    });
    const data = await res.json();
    setAddingTask(false);
    if (!res.ok) {
      toast({ title: "Erro ao adicionar tarefa", description: data.error, variant: "destructive" });
    } else {
      setNewTaskName("");
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

  return (
    <div>
      <Topbar title="Gerenciar Sprint" subtitle="Gerencie as tarefas da sprint e envie para o Asana" />
      <div className="p-6 space-y-6">

        {/* Sprint list + creation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sprints</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowNewSprint(!showNewSprint)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Sprint
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showNewSprint && (
              <div className="border rounded-md p-4 space-y-3 bg-slate-50">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label>Nome da Sprint *</Label>
                    <Input
                      value={newSprint.name}
                      onChange={(e) => setNewSprint((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: Sprint 1 – Abril 2026"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Objetivo</Label>
                    <Input
                      value={newSprint.goal}
                      onChange={(e) => setNewSprint((f) => ({ ...f, goal: e.target.value }))}
                      placeholder="Ex: Estruturar funil de vendas e qualificar leads"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Início</Label>
                      <Input
                        type="date"
                        value={newSprint.start_date}
                        onChange={(e) => setNewSprint((f) => ({ ...f, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fim</Label>
                      <Input
                        type="date"
                        value={newSprint.end_date}
                        onChange={(e) => setNewSprint((f) => ({ ...f, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createSprint} disabled={loading || !newSprint.name.trim()}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Sprint
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewSprint(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {sprints.length === 0 && !showNewSprint && (
              <p className="text-sm text-slate-400">Nenhuma sprint criada. Clique em Nova Sprint.</p>
            )}

            <div className="space-y-2">
              {sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    activeSprint?.id === sprint.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => selectSprint(sprint)}
                >
                  <Badge variant={STATUS_VARIANTS[sprint.status] ?? "outline"} className="mt-0.5 flex-shrink-0">
                    {STATUS_LABELS[sprint.status]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sprint.name}</p>
                    {sprint.goal && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Target className="h-3 w-3" /> {sprint.goal}
                      </p>
                    )}
                    {(sprint.start_date || sprint.end_date) && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {sprint.start_date ? formatDate(sprint.start_date) : "?"} → {sprint.end_date ? formatDate(sprint.end_date) : "?"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {sprint.status === "planning" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => updateSprintStatus(sprint.id, "active")}>
                        <Play className="h-3 w-3 mr-1" /> Iniciar
                      </Button>
                    )}
                    {sprint.status === "active" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => updateSprintStatus(sprint.id, "completed")}>
                        <CheckSquare className="h-3 w-3 mr-1" /> Concluir
                      </Button>
                    )}
                    <button
                      onClick={() => deleteSprint(sprint)}
                      className="h-7 px-1.5 rounded border border-transparent text-slate-300 hover:text-red-500 hover:border-red-200 transition-colors"
                      title="Excluir sprint"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeSprint && (
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
            <CardContent className="space-y-4 pt-0">
              {/* Add manual task */}
              <form onSubmit={addManualTask} className="flex gap-2">
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Nome da nova tarefa..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={addingTask || !newTaskName.trim()}>
                  {addingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Adicionar
                </Button>
              </form>

              {sprintTasks.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Nenhuma tarefa adicionada à sprint ainda.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {sprintTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 group">
                      <Badge variant={TASK_STATUS_VARIANTS[task.status] ?? "outline"} className="text-xs flex-shrink-0">
                        {task.status}
                      </Badge>
                      <span className="text-sm flex-1 truncate">{task.name}</span>
                      {task.asana_task_id && (
                        <span className="text-xs text-slate-400 flex-shrink-0">Asana ✓</span>
                      )}
                      <button
                        onClick={() => deleteSprintTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                        title="Remover da sprint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
