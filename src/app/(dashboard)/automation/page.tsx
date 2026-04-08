"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogTable } from "@/components/ai/AuditLogTable";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, RefreshCw } from "lucide-react";

export default function AutomationPage() {
  const { toast } = useToast();
  const [runningCron, setRunningCron] = useState(false);

  async function triggerCron() {
    setRunningCron(true);
    const res = await fetch("/api/cron/weekly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cron-Secret": prompt("Digite o CRON_SECRET para confirmar:") ?? "",
      },
    });
    const data = await res.json();
    setRunningCron(false);

    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      toast({ title: `Cron executado! ${data.processed} cliente(s) processado(s).` });
    }
  }

  return (
    <div>
      <Topbar
        title="Automação & Log"
        subtitle="Controle e rastreabilidade das ações da IA"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trigger Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              O cron semanal roda automaticamente toda segunda-feira às 09:00. Você pode disparar manualmente aqui para teste.
            </p>
            <Button onClick={triggerCron} disabled={runningCron} variant="outline">
              {runningCron ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Executar Cron Agora
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Log Completo de Ações da IA</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
