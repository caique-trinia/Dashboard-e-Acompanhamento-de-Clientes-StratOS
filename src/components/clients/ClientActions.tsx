"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Heart } from "lucide-react";

interface ClientActionsProps {
  clientId: string;
  clientName: string;
}

export function ClientActions({ clientId, clientName }: ClientActionsProps) {
  const { toast } = useToast();
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  async function triggerFollowUp() {
    setLoadingFollowUp(true);
    const res = await fetch("/api/ai/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    const data = await res.json();
    setLoadingFollowUp(false);

    if (!res.ok) {
      toast({ title: "Erro no follow-up", description: data.error, variant: "destructive" });
    } else {
      toast({
        title: "Follow-up concluído",
        description: `${data.actionsExecuted} ação(ões) executada(s) para ${clientName}.`,
      });
    }
  }

  async function triggerHealth() {
    setLoadingHealth(true);
    const res = await fetch("/api/ai/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    const data = await res.json();
    setLoadingHealth(false);

    if (!res.ok) {
      toast({ title: "Erro na análise", description: data.error, variant: "destructive" });
    } else {
      toast({
        title: "Análise de saúde atualizada",
        description: `Score: ${data.health_score}/100`,
      });
      // Reload to show updated score
      window.location.reload();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={triggerHealth}
        disabled={loadingHealth}
      >
        {loadingHealth ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className="h-4 w-4" />
        )}
        <span className="ml-1.5">Analisar Saúde</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={triggerFollowUp}
        disabled={loadingFollowUp}
      >
        {loadingFollowUp ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
        <span className="ml-1.5">IA Follow-up</span>
      </Button>
    </div>
  );
}
