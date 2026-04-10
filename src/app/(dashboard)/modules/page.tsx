"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleTree } from "@/components/modules/ModuleTree";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, BookOpen, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ModuleLibrary, ModuleTask } from "@/types/database";

export default function ModulesPage() {
  const { toast } = useToast();
  const [libraries, setLibraries] = useState<ModuleLibrary[]>([]);
  const [selectedLib, setSelectedLib] = useState<ModuleLibrary | null>(null);
  const [tasks, setTasks] = useState<ModuleTask[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [libName, setLibName] = useState("");

  useEffect(() => {
    fetchLibraries();
  }, []);

  useEffect(() => {
    if (selectedLib) fetchTasks(selectedLib.id);
  }, [selectedLib]);

  async function fetchLibraries() {
    const res = await fetch("/api/modules");
    const data = await res.json();
    if (Array.isArray(data)) {
      setLibraries(data);
      if (data.length > 0 && !selectedLib) setSelectedLib(data[0]);
    }
  }

  async function fetchTasks(libraryId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("module_tasks")
      .select("*")
      .eq("library_id", libraryId)
      .order("sort_order");
    if (data) setTasks(data as ModuleTask[]);
  }

  async function handleDeleteLibrary(lib: ModuleLibrary) {
    if (!window.confirm(`Excluir o módulo "${lib.name}" e suas ${lib.task_count} tarefas?`)) return;
    const res = await fetch(`/api/modules/${lib.id}`, { method: "DELETE" });
    if (res.ok) {
      setLibraries((prev) => prev.filter((l) => l.id !== lib.id));
      if (selectedLib?.id === lib.id) { setSelectedLib(null); setTasks([]); }
      toast({ title: "Módulo excluído." });
    } else {
      toast({ title: "Erro ao excluir módulo", variant: "destructive" });
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !libName.trim()) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("libraryName", libName);

    const res = await fetch("/api/modules/import", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      toast({ title: "Erro ao importar", description: data.error, variant: "destructive" });
    } else {
      toast({ title: `Módulo importado! ${data.taskCount} tarefas carregadas.` });
      setShowUpload(false);
      setFile(null);
      setLibName("");
      fetchLibraries();
    }
  }

  return (
    <div>
      <Topbar
        title="Módulos"
        subtitle="Bibliotecas de tarefas metodológicas"
        actions={
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-1" />
            Importar CSV
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {showUpload && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Importar Módulo CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Nome do Módulo</Label>
                  <Input
                    value={libName}
                    onChange={(e) => setLibName(e.target.value)}
                    placeholder="Ex: Módulo de Vendas v1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo CSV</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Colunas esperadas: Name, Description, Section, Parent Task, Seção do Manual
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Importar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Library list */}
          <div className="space-y-2">
            {libraries.map((lib) => (
              <div
                key={lib.id}
                onClick={() => setSelectedLib(lib)}
                className={`relative group w-full text-left p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedLib?.id === lib.id ? "border-primary bg-primary/5" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 pr-6">
                  <BookOpen className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{lib.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-6">
                  {lib.task_count} tarefas · {formatDate(lib.created_at)}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteLibrary(lib); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                  title="Excluir módulo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {libraries.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhum módulo importado.
              </p>
            )}
          </div>

          {/* Task tree */}
          {selectedLib && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {selectedLib.name}
                    <span className="text-sm font-normal text-slate-400 ml-2">
                      ({tasks.length} tarefas)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ModuleTree tasks={tasks} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
