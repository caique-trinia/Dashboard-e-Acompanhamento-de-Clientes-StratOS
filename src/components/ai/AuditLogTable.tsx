"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { AiAuditLog } from "@/types/database";

const ACTION_LABELS: Record<string, string> = {
  follow_up_comment: "Comentário",
  task_moved: "Moveu tarefa",
  task_created: "Criou tarefa",
  health_analysis: "Análise de saúde",
  sprint_suggestion: "Sugestão de sprint",
  cron_run_started: "Cron iniciado",
  cron_run_completed: "Cron concluído",
  cron_run_failed: "Cron falhou",
};

export function AuditLogTable({ clientId }: { clientId?: string }) {
  const [logs, setLogs] = useState<(AiAuditLog & { clients?: { name: string } })[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchLogs() {
      let query = supabase
        .from("ai_audit_log")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (clientId) query = query.eq("client_id", clientId);

      const { data } = await query;
      if (data) setLogs(data as (AiAuditLog & { clients?: { name: string } })[]);
    }

    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel("ai_audit_log_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_audit_log" }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Data/Hora</th>
            {!clientId && <th className="px-4 py-3 text-left font-medium text-slate-600">Cliente</th>}
            <th className="px-4 py-3 text-left font-medium text-slate-600">Ação</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Gatilho</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Detalhes</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((log) => (
            <Fragment key={log.id}>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </td>
                {!clientId && (
                  <td className="px-4 py-3 font-medium">
                    {(log.clients as { name: string } | null)?.name ?? "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  {ACTION_LABELS[log.action_type] ?? log.action_type}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">
                    {log.triggered_by}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {log.success ? (
                    <Badge variant="success">OK</Badge>
                  ) : (
                    <Badge variant="destructive">Erro</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {log.asana_action && (
                    <button
                      className="text-blue-600 hover:underline text-xs"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      {expandedId === log.id ? "Fechar" : "Ver"}
                    </button>
                  )}
                  {!log.success && log.error_message && (
                    <span className="text-red-600 text-xs ml-1">{log.error_message.slice(0, 80)}</span>
                  )}
                </td>
              </tr>
              {expandedId === log.id && log.asana_action && (
                <tr className="bg-slate-50">
                  <td colSpan={clientId ? 5 : 6} className="px-4 py-2">
                    <pre className="text-xs bg-white border rounded p-2 overflow-auto max-h-40">
                      {JSON.stringify(log.asana_action, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={clientId ? 5 : 6} className="px-4 py-8 text-center text-slate-400">
                Nenhuma ação registrada ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
