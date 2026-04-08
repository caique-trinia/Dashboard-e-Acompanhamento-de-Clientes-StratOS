"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info, Bot, Loader2 } from "lucide-react";
import type { SystemSettings } from "@/lib/settings";

interface AvailableModel { value: string; label: string; description: string }

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setModels(d.availableModels);
      });
  }, []);

  async function handleModelChange(model: string) {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geminiModel: model }),
    });
    const data = await res.json();
    if (data.settings) {
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div>
      <Topbar title="Configurações" subtitle="Informações do sistema e variáveis de ambiente" />
      <div className="p-6 space-y-4 max-w-2xl">

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Modelo de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!settings ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <div className="space-y-2">
                {models.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      settings.geminiModel === m.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="geminiModel"
                      value={m.value}
                      checked={settings.geminiModel === m.value}
                      onChange={() => handleModelChange(m.value)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-slate-400">{m.description}</p>
                    </div>
                    {settings.geminiModel === m.value && (
                      <Badge variant="success" className="text-xs shrink-0">Ativo</Badge>
                    )}
                  </label>
                ))}
                <div className="flex items-center gap-2 pt-1 h-6">
                  {saving && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
                    </p>
                  )}
                  {saved && !saving && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Modelo atualizado — válido para a próxima chamada de IA
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">Asana PAT</p>
                <p className="text-xs text-slate-400">Token de acesso pessoal para interagir com o Asana</p>
              </div>
              <Badge variant="outline" className="text-xs">Verificar no .env.local</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">Gemini API Key</p>
                <p className="text-xs text-slate-400">Chave de API do Google para automações de IA</p>
              </div>
              <Badge variant="outline" className="text-xs">Verificar no .env.local</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Supabase</p>
                <p className="text-xs text-slate-400">Banco de dados e autenticação</p>
              </div>
              <Badge variant="outline" className="text-xs">Verificar no .env.local</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como configurar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Copie o arquivo <code className="bg-slate-100 px-1 rounded">.env.example</code> para <code className="bg-slate-100 px-1 rounded">.env.local</code></li>
              <li>Preencha as variáveis com suas credenciais</li>
              <li>Reinicie o servidor com <code className="bg-slate-100 px-1 rounded">npm run dev:next</code></li>
              <li>Execute as migrations no Supabase SQL Editor</li>
              <li>Crie os usuários no painel do Supabase (Authentication &gt; Users)</li>
              <li>Inicie o cron em outro terminal: <code className="bg-slate-100 px-1 rounded">npm run cron</code></li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Usuários Autorizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              O sistema aceita apenas usuários pré-cadastrados. Para adicionar ou remover usuários,
              acesse o painel do Supabase em <strong>Authentication &gt; Users</strong>.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              O signup público está desabilitado por segurança.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
