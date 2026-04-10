"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
interface TaskSummary {
  gid: string;
  name: string;
  completed: boolean;
  due_on: string | null;
}

interface AssigneePerf {
  assigneeGid: string;
  assigneeName: string;
  total: number;
  completed: number;
  overdue: number;
  tasks: TaskSummary[];
}

interface PerformanceData {
  month: string;
  projectGid: string;
  totals: { total: number; completed: number; overdue: number };
  byAssignee: AssigneePerf[];
}

interface ProjectDashboardProps {
  projectGid: string;
  clientId: string;
}

function monthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function ProjectDashboard({ projectGid, clientId }: ProjectDashboardProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/performance?projectGid=${projectGid}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao buscar dados");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [clientId, projectGid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleExpanded(gid: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(gid) ? next.delete(gid) : next.add(gid);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-500">
            Desempenho Mensal
            {data && (
              <Badge variant="outline" className="ml-2 text-xs font-normal capitalize">
                {monthLabel(data.month)}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando tarefas do Asana...
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 py-2">{error}</p>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{data.totals.total}</p>
                <p className="text-xs text-slate-500 mt-1">Total no mês</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: "#0a0b69" }}>{data.totals.completed}</p>
                <p className="text-xs text-slate-500 mt-1">Concluídas</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-red-500">{data.totals.overdue}</p>
                <p className="text-xs text-slate-500 mt-1">Vencidas</p>
              </div>
            </div>

            {/* Per-assignee breakdown */}
            {data.byAssignee.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Nenhuma tarefa com prazo neste mês.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Por responsável</p>
                {data.byAssignee.map((a) => {
                  const isOpen = expanded.has(a.assigneeGid);
                  const pct = a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0;
                  return (
                    <div key={a.assigneeGid} className="border rounded-md overflow-hidden">
                      <button
                        className="w-full flex items-center gap-2 p-3 text-left hover:bg-slate-50 transition-colors"
                        onClick={() => toggleExpanded(a.assigneeGid)}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium flex-1 truncate">{a.assigneeName}</span>
                        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {a.completed}/{a.total}
                          </span>
                          {a.overdue > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="h-3 w-3" />
                              {a.overdue} vencida(s)
                            </span>
                          )}
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t bg-slate-50 divide-y">
                          {a.tasks.map((task) => (
                            <div key={task.gid} className="flex items-center gap-2 px-4 py-2">
                              {task.completed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                              ) : task.due_on && task.due_on < new Date().toISOString().slice(0, 10) ? (
                                <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                              )}
                              <span className={`text-xs flex-1 truncate ${task.completed ? "line-through text-slate-400" : ""}`}>
                                {task.name}
                              </span>
                              {task.due_on && (
                                <span className="text-xs text-slate-400 flex-shrink-0">
                                  {task.due_on}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
