import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info } from "lucide-react";

export default function SettingsPage() {
  const asanaPat = process.env.ASANA_PAT ? "Configurado" : "Não configurado";
  const geminiKey = process.env.GEMINI_API_KEY ? "Configurado" : "Não configurado";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado" : "Não configurado";

  return (
    <div>
      <Topbar title="Configurações" subtitle="Informações do sistema e variáveis de ambiente" />
      <div className="p-6 space-y-4 max-w-2xl">
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
              <Badge variant={process.env.ASANA_PAT ? "success" : "destructive"}>
                {asanaPat}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">Gemini API Key</p>
                <p className="text-xs text-slate-400">Chave de API do Google para automações de IA</p>
              </div>
              <Badge variant={process.env.GEMINI_API_KEY ? "success" : "destructive"}>
                {geminiKey}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Supabase</p>
                <p className="text-xs text-slate-400">Banco de dados e autenticação</p>
              </div>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "success" : "destructive"}>
                {supabaseUrl}
              </Badge>
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
              <li>Crie os 3 usuários no painel do Supabase (Authentication &gt; Users)</li>
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
