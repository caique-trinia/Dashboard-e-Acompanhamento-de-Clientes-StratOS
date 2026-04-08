"use client";

import { useState, useEffect, use, useRef, Fragment } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText, Upload, SquarePen, CheckSquare2, Square, Trash2 } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";
import type { MeetingNote, Sprint, MeetingActionItem } from "@/types/database";

const MEETING_TYPE_LABELS: Record<string, string> = {
  planning: "Planejamento",
  checkin: "Check-in",
  retrospective: "Retrospectiva",
  kickoff: "Kickoff",
  review: "Revisão",
  other: "Outro",
};

export default function MeetingsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [inputMode, setInputMode] = useState<"type" | "upload">("type");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MeetingNote | null>(null);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [newItem, setNewItem] = useState({ description: "", assignee: "", due_date: "" });
  const [addingItem, setAddingItem] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    meeting_type: "",
    sprint_id: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMeetings();
    fetchSprints();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (selected) fetchActionItems(selected.id);
  }, [selected]);

  async function fetchMeetings() {
    const res = await fetch(`/api/meetings?clientId=${clientId}`);
    const data = await res.json();
    if (Array.isArray(data)) setMeetings(data);
  }

  async function fetchSprints() {
    const res = await fetch(`/api/sprints?clientId=${clientId}`);
    const data = await res.json();
    if (Array.isArray(data)) setSprints(data);
  }

  async function fetchActionItems(meetingId: string) {
    const res = await fetch(`/api/meetings/${meetingId}/action-items`);
    const data = await res.json();
    if (Array.isArray(data)) setActionItems(data);
  }

  async function handleSubmitTyped(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: form.title,
        content: form.content,
        meeting_type: form.meeting_type || null,
        sprint_id: form.sprint_id || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Ata salva!" });
      resetForm();
      fetchMeetings();
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("client_id", clientId);
    if (form.title) fd.append("title", form.title);
    if (form.meeting_type) fd.append("meeting_type", form.meeting_type);
    if (form.sprint_id) fd.append("sprint_id", form.sprint_id);

    const res = await fetch("/api/meetings/upload", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Erro no upload", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Arquivo importado com sucesso!" });
      resetForm();
      fetchMeetings();
    }
  }

  function resetForm() {
    setShowForm(false);
    setForm({ title: "", content: "", meeting_type: "", sprint_id: "" });
    setUploadFile(null);
    setInputMode("type");
  }

  async function toggleActionItem(item: MeetingActionItem) {
    const res = await fetch(
      `/api/meetings/${item.meeting_id}/action-items/${item.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      }
    );
    if (res.ok) {
      setActionItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
      );
    }
  }

  async function deleteActionItem(item: MeetingActionItem) {
    const res = await fetch(
      `/api/meetings/${item.meeting_id}/action-items/${item.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setActionItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  async function addActionItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newItem.description.trim()) return;
    setAddingItem(true);
    const res = await fetch(`/api/meetings/${selected.id}/action-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: newItem.description,
        assignee: newItem.assignee || null,
        due_date: newItem.due_date || null,
      }),
    });
    const data = await res.json();
    setAddingItem(false);
    if (res.ok) {
      setActionItems((prev) => [...prev, data]);
      setNewItem({ description: "", assignee: "", due_date: "" });
    }
  }

  const openCount = actionItems.filter((i) => !i.done).length;

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
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registrar Reunião</CardTitle>
              {/* Input mode toggle */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-md w-fit mt-1">
                <button
                  type="button"
                  onClick={() => setInputMode("type")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    inputMode === "type" ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <SquarePen className="h-3.5 w-3.5" /> Digitar
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    inputMode === "upload" ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload PDF / .md
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={inputMode === "type" ? handleSubmitTyped : handleUpload} className="space-y-4">
                {/* Common fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <Label>Tipo de Reunião</Label>
                    <Select value={form.meeting_type} onValueChange={(v) => setForm((f) => ({ ...f, meeting_type: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MEETING_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label>Sprint (opcional)</Label>
                    <Select value={form.sprint_id} onValueChange={(v) => setForm((f) => ({ ...f, sprint_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                      <SelectContent>
                        {sprints.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label>Título {inputMode === "upload" ? "(opcional)" : "*"}</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder={inputMode === "upload" ? "Auto: nome do arquivo" : "Ex: Check-in semanal – 01/04"}
                      required={inputMode === "type"}
                    />
                  </div>
                </div>

                {inputMode === "type" ? (
                  <div className="space-y-1">
                    <Label>Conteúdo / Ata *</Label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      placeholder="Cole aqui a ata, pontos discutidos, decisões tomadas, próximos passos..."
                      rows={8}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label>Arquivo (PDF ou .md)</Label>
                    <div
                      className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadFile ? (
                        <p className="text-sm font-medium text-slate-700">{uploadFile.name}</p>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm text-slate-500">Clique para selecionar PDF ou .md</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.md,text/markdown,application/pdf"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading || (inputMode === "upload" && !uploadFile)}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {inputMode === "upload" ? "Importar" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Meeting list */}
          <div className="space-y-2">
            {meetings.map((m) => (
              <button
                key={m.id}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selected?.id === m.id ? "border-primary bg-primary/5" : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => setSelected(m)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{m.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-6">
                  {m.meeting_type && (
                    <Badge variant="outline" className="text-xs py-0">
                      {MEETING_TYPE_LABELS[m.meeting_type] ?? m.meeting_type}
                    </Badge>
                  )}
                  <p className="text-xs text-slate-400">{formatDateTime(m.created_at)}</p>
                </div>
              </button>
            ))}
            {meetings.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Nenhuma reunião registrada.</p>
            )}
          </div>

          {/* Meeting detail */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{selected.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {selected.meeting_type && (
                          <Badge variant="outline" className="text-xs">
                            {MEETING_TYPE_LABELS[selected.meeting_type] ?? selected.meeting_type}
                          </Badge>
                        )}
                        <p className="text-xs text-slate-400">{formatDateTime(selected.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700 max-h-[400px] overflow-auto">
                    {selected.content}
                  </pre>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckSquare2 className="h-4 w-4" />
                    Itens de Ação
                    {openCount > 0 && (
                      <Badge variant="warning" className="text-xs">{openCount} em aberto</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* List */}
                  {actionItems.length > 0 && (
                    <div className="space-y-1">
                      {actionItems.map((item) => (
                        <Fragment key={item.id}>
                          <div className={`flex items-start gap-2 py-1.5 group ${item.done ? "opacity-50" : ""}`}>
                            <button
                              onClick={() => toggleActionItem(item)}
                              className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-primary transition-colors"
                            >
                              {item.done
                                ? <CheckSquare2 className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                                : <Square className="h-4 w-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${item.done ? "line-through" : ""}`}>{item.description}</p>
                              <p className="text-xs text-slate-400">
                                {item.assignee && <span className="font-medium">{item.assignee}</span>}
                                {item.assignee && item.due_date && " · "}
                                {item.due_date && `até ${formatDate(item.due_date)}`}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteActionItem(item)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  )}

                  {/* Add new item form */}
                  <form onSubmit={addActionItem} className="space-y-2 border-t pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        className="sm:col-span-1"
                        placeholder="Descrição do item de ação *"
                        value={newItem.description}
                        onChange={(e) => setNewItem((f) => ({ ...f, description: e.target.value }))}
                      />
                      <Input
                        placeholder="Responsável"
                        value={newItem.assignee}
                        onChange={(e) => setNewItem((f) => ({ ...f, assignee: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={newItem.due_date}
                        onChange={(e) => setNewItem((f) => ({ ...f, due_date: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" size="sm" variant="outline" disabled={addingItem || !newItem.description.trim()}>
                      {addingItem && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar item
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
