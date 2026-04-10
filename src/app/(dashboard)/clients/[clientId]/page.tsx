import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { HealthScoreBadge } from "@/components/ai/HealthScoreBadge";
import { AuditLogTable } from "@/components/ai/AuditLogTable";
import { ClientActions } from "@/components/clients/ClientActions";
import { ClientProjectTabs } from "@/components/clients/ClientProjectTabs";
import { ClientProjectManager } from "@/components/clients/ClientProjectManager";
import { ProjectDashboard } from "@/components/clients/ProjectDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { clientId } = await params;
  const { project: projectParam } = await searchParams;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) notFound();

  const [{ data: projects }, { data: sprints }, { data: recentMeetings }] = await Promise.all([
    supabase
      .from("client_asana_projects")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order"),
    supabase
      .from("sprints")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("meeting_notes")
      .select("id, title, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const activeSprint = sprints?.find((s) => s.status === "active");
  const activeProjectGid = projectParam ?? projects?.[0]?.project_gid ?? null;

  return (
    <div>
      <Topbar
        title={client.name}
        subtitle={projects && projects.length > 0 ? `${projects.length} projeto(s) Asana` : (client.asana_project_name ?? "Projeto Asana")}
        actions={
          <div className="flex items-center gap-2">
            <ClientProjectManager
              clientId={clientId}
              workspaceId={client.asana_workspace_id}
            />
            <ClientActions clientId={client.id} clientName={client.name} />
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {/* Health + Context */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Saúde do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthScoreBadge
                score={client.health_score}
                summary={client.health_summary}
                updatedAt={client.health_updated_at}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Contexto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {client.context_notes ?? "Sem contexto cadastrado."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project tabs + performance dashboard */}
        {activeProjectGid && (
          <Card>
            <CardHeader className="pb-0">
              <ClientProjectTabs
                projects={projects ?? []}
                activeGid={activeProjectGid}
                clientId={clientId}
              />
            </CardHeader>
            <CardContent className="pt-4">
              <ProjectDashboard
                projectGid={activeProjectGid}
                clientId={clientId}
              />
            </CardContent>
          </Card>
        )}

        {/* Sprint + Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Sprints
              </CardTitle>
              <Link href={`/clients/${clientId}/sprint`}>
                <Button variant="outline" size="sm">Gerenciar</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeSprint ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Ativa</Badge>
                    <span className="text-sm font-medium">{activeSprint.name}</span>
                  </div>
                  {activeSprint.start_date && (
                    <p className="text-xs text-slate-500">
                      {formatDate(activeSprint.start_date)} → {activeSprint.end_date ? formatDate(activeSprint.end_date) : "sem fim"}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nenhuma sprint ativa.</p>
              )}
              {(sprints?.length ?? 0) > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  {sprints!.length} sprint(s) no total
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reuniões Recentes
              </CardTitle>
              <Link href={`/clients/${clientId}/meetings`}>
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentMeetings && recentMeetings.length > 0 ? (
                <ul className="space-y-1">
                  {recentMeetings.map((m) => (
                    <li key={m.id} className="text-sm">
                      <span className="font-medium">{m.title}</span>
                      <span className="text-slate-400 text-xs ml-2">{formatDate(m.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">Nenhuma reunião registrada.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Log */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Log de Ações da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogTable clientId={clientId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
