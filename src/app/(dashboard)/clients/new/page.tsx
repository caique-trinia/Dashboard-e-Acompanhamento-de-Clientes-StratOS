"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AsanaWorkspacePicker } from "@/components/clients/AsanaWorkspacePicker";
import { AsanaProjectPicker } from "@/components/clients/AsanaProjectPicker";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    context_notes: "",
    asana_workspace_id: "",
    asana_workspace_name: "",
    asana_project_id: "",
    asana_project_name: "",
  });

  function handleWorkspaceSelect(gid: string, name: string) {
    setForm((f) => ({
      ...f,
      asana_workspace_id: gid,
      asana_workspace_name: name,
      asana_project_id: "",
      asana_project_name: "",
    }));
  }

  function handleProjectSelect(gid: string, name: string) {
    setForm((f) => ({ ...f, asana_project_id: gid, asana_project_name: name }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.asana_project_id) {
      toast({ title: "Selecione um projeto Asana", variant: "destructive" });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        context_notes: form.context_notes,
        asana_workspace_id: form.asana_workspace_id || null,
        asana_project_id: form.asana_project_id,
        asana_project_name: form.asana_project_name,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast({ title: "Erro ao cadastrar cliente", description: data.error, variant: "destructive" });
      return;
    }

    toast({ title: "Cliente cadastrado com sucesso!" });
    router.push(`/clients/${data.id}`);
  }

  return (
    <div>
      <Topbar title="Novo Cliente" subtitle="Cadastrar empresa cliente" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Empresa ABC"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Workspace Asana</Label>
                <AsanaWorkspacePicker
                  value={form.asana_workspace_id}
                  onSelect={handleWorkspaceSelect}
                />
                <p className="text-xs text-slate-500">
                  Deixe no workspace padrão ou selecione um diferente para este cliente.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Projeto Asana *</Label>
                <AsanaProjectPicker
                  value={form.asana_project_id}
                  workspaceId={form.asana_workspace_id || undefined}
                  onSelect={handleProjectSelect}
                />
                {form.asana_project_name && (
                  <p className="text-xs text-slate-500">Selecionado: {form.asana_project_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="context_notes">Contexto da Empresa</Label>
                <Textarea
                  id="context_notes"
                  value={form.context_notes}
                  onChange={(e) => setForm((f) => ({ ...f, context_notes: e.target.value }))}
                  placeholder="Descreva o contexto, objetivos, desafios e informações relevantes sobre este cliente. A IA usará este contexto nos follow-ups..."
                  rows={5}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar Cliente
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
