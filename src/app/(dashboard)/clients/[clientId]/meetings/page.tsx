"use client";

import { useState, useEffect, use } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { MeetingNote } from "@/types/database";

export default function MeetingsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MeetingNote | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchMeetings();
  }, [clientId]);

  async function fetchMeetings() {
    const res = await fetch(`/api/meetings?clientId=${clientId}`);
    const data = await res.json();
    if (Array.isArray(data)) setMeetings(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Notas de reunião salvas!" });
      setShowForm(false);
      setForm({ title: "", content: "" });
      fetchMeetings();
    }
  }

  return (
    <div>
      <Topbar
        title="Notas de Reunião"
        subtitle="Adicione contexto de reuniões para a IA usar nos follow-ups"
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Reunião
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar Reunião</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Reunião de alinhamento - 01/04/2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo / Ata da Reunião</Label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Cole aqui a ata, pontos discutidos, decisões tomadas, próximos passos..."
                    rows={8}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {meetings.map((m) => (
              <button
                key={m.id}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selected?.id === m.id
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => setSelected(m)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{m.title}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-6">{formatDateTime(m.created_at)}</p>
              </button>
            ))}
            {meetings.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhuma reunião registrada.
              </p>
            )}
          </div>

          {selected && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selected.title}</CardTitle>
                <p className="text-xs text-slate-400">{formatDateTime(selected.created_at)}</p>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700 max-h-[500px] overflow-auto">
                  {selected.content}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
