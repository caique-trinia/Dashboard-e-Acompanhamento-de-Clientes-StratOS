"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthScoreBadge } from "@/components/ai/HealthScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, Trash2 } from "lucide-react";
import type { Client } from "@/types/database";

interface ClientCardProps {
  client: Client;
  onDelete?: (id: string) => void;
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  return (
    <div className="relative group">
      <Link href={`/clients/${client.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <CardTitle className="text-base">{client.name}</CardTitle>
              </div>
              {!client.is_active && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">Inativo</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Saúde:</span>
              <HealthScoreBadge
                score={client.health_score}
                summary={client.health_summary}
                updatedAt={client.health_updated_at}
              />
            </div>
            {client.asana_project_name && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{client.asana_project_name}</span>
              </div>
            )}
            {client.context_notes && (
              <p className="text-xs text-slate-600 line-clamp-2">{client.context_notes}</p>
            )}
          </CardContent>
        </Card>
      </Link>
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.confirm(`Excluir o cliente "${client.name}"? Esta ação removerá também todas as sprints e atas vinculadas.`)) {
              onDelete(client.id);
            }
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-all shadow-sm"
          title="Excluir cliente"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
