"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, Bot, Loader2, Zap, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SystemSettings, AvailableModel } from "@/lib/settings";

interface SettingsData {
  settings: SystemSettings;
  availableModels: AvailableModel[];
  groqConfigured: boolean;
  geminiConfigured: boolean;
  profile: { email: string | null; name: string | null };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setProfileName(d.profile?.name ?? "");
      });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: profileName } });
    setSavingProfile(false);
    if (error) {
      toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  }

  async function handleModelChange(model: string) {
    if (!data) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiModel: model }),
    });
    const result = await res.json();
    if (result.settings) {
      setData((prev) => prev ? { ...prev, settings: result.settings } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  const geminiModels = data?.availableModels.filter((m) => m.provider === "gemini") ?? [];
  const groqModels = data?.availableModels.filter((m) => m.provider === "groq") ?? [];

  return (
    <div>
      <Topbar title="Configurações" subtitle="Informações do sistema e variáveis de ambiente" />
      <div className="p-6 space-y-4 max-w-2xl">

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 max-w-sm">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={data.profile?.email ?? ""} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <Label>Nome de exibição</Label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <Button type="submit" size="sm" disabled={savingProfile}>
                  {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* AI Model Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Modelo de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <div className="space-y-4">

                {/* Gemini group */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Google Gemini</p>
                    <Badge variant={data.geminiConfigured ? "success" : "destructive"} className="text-xs">
                      {data.geminiConfigured ? "API Key OK" : "GEMINI_API_KEY ausente"}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {geminiModels.map((m) => (
                      <ModelOption
                        key={m.value}
                        model={m}
                        selected={data.settings.aiModel === m.value}
                        disabled={!data.geminiConfigured}
                        onChange={handleModelChange}
                      />
                    ))}
                  </div>
                </div>

                {/* Groq group */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Groq
                    </p>
                    <Badge variant={data.groqConfigured ? "success" : "warning"} className="text-xs">
                      {data.groqConfigured ? "API Key OK" : "GROQ_API_KEY ausente"}
                    </Badge>
                    {!data.groqConfigured && (
                      <span className="text-xs text-slate-400">— adicione no .env.local</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {groqModels.map((m) => (
                      <ModelOption
                        key={m.value}
                        model={m}
                        selected={data.settings.aiModel === m.value}
                        disabled={!data.groqConfigured}
                        onChange={handleModelChange}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 h-5">
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

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Asana PAT", desc: "Token de acesso pessoal para interagir com o Asana" },
              { label: "Gemini API Key", desc: "Google AI — adicione GEMINI_API_KEY no .env.local" },
              { label: "Groq API Key", desc: "Groq — adicione GROQ_API_KEY no .env.local (console.groq.com)" },
              { label: "Supabase", desc: "Banco de dados e autenticação" },
            ].map((item, i, arr) => (
              <div key={item.label} className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? "border-b" : ""}`}>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <Badge variant="outline" className="text-xs">Ver .env.local</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Setup instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como configurar o Groq
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Acesse <strong>console.groq.com</strong> e crie uma API Key gratuita</li>
              <li>Adicione no <code className="bg-slate-100 px-1 rounded">.env.local</code>: <code className="bg-slate-100 px-1 rounded">GROQ_API_KEY=gsk_...</code></li>
              <li>Reinicie o servidor com <code className="bg-slate-100 px-1 rounded">npm run dev</code></li>
              <li>Volte aqui e selecione um modelo Groq acima</li>
            </ol>
          </CardContent>
        </Card>

        {/* Authorized users */}
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

function ModelOption({
  model, selected, disabled, onChange,
}: {
  model: AvailableModel;
  selected: boolean;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
        disabled
          ? "opacity-40 cursor-not-allowed border-slate-200"
          : selected
          ? "border-blue-500 bg-blue-50 cursor-pointer"
          : "border-slate-200 hover:bg-slate-50 cursor-pointer"
      }`}
    >
      <input
        type="radio"
        name="aiModel"
        value={model.value}
        checked={selected}
        disabled={disabled}
        onChange={() => !disabled && onChange(model.value)}
        className="mt-0.5"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{model.label}</p>
        <p className="text-xs text-slate-400">{model.description}</p>
      </div>
      {selected && <Badge variant="success" className="text-xs shrink-0">Ativo</Badge>}
    </label>
  );
}
