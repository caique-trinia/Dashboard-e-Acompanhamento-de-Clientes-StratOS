"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number | null;
  summary: string | null;
  updatedAt: string | null;
}

export function HealthScoreBadge({ score, summary, updatedAt }: HealthScoreBadgeProps) {
  if (score === null) {
    return <Badge variant="outline">Sem análise</Badge>;
  }

  const variant =
    score >= 71 ? "success" : score >= 41 ? "warning" : "destructive";

  const label = score >= 71 ? "Saudável" : score >= 41 ? "Atenção" : "Crítico";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="focus:outline-none">
          <Badge variant={variant} className="cursor-pointer hover:opacity-80 transition-opacity">
            {score} — {label}
          </Badge>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saúde do Projeto — Score: {score}/100</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Análise da IA</p>
            <p className="text-sm text-slate-600 mt-1">{summary ?? "Sem resumo disponível."}</p>
          </div>
          {updatedAt && (
            <p className="text-xs text-slate-400">
              Atualizado em: {formatDateTime(updatedAt)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
