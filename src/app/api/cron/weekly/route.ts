import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runFollowUpForClient, runHealthAnalysis } from "@/lib/ai/followup";
import { sleep } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("X-Cron-Secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();

  await supabase.from("ai_audit_log").insert({
    action_type: "cron_run_started",
    triggered_by: "cron",
    success: true,
    metadata: { startedAt: new Date().toISOString() },
  });

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true);

  if (!clients || clients.length === 0) {
    return NextResponse.json({ processed: 0, message: "Sem clientes ativos" });
  }

  const results: { clientId: string; name: string; actionsExecuted: number; errors: string[] }[] = [];

  for (const client of clients) {
    console.log(`[cron] Processando cliente: ${client.name}`);

    const [followUpResult] = await Promise.allSettled([runFollowUpForClient(client)]);
    await sleep(2000);
    await runHealthAnalysis(client);
    await sleep(2000);

    results.push({
      clientId: client.id,
      name: client.name,
      actionsExecuted:
        followUpResult.status === "fulfilled" ? followUpResult.value.actionsExecuted : 0,
      errors: followUpResult.status === "rejected" ? [followUpResult.reason] : [],
    });
  }

  await supabase.from("ai_audit_log").insert({
    action_type: "cron_run_completed",
    triggered_by: "cron",
    success: true,
    metadata: {
      completedAt: new Date().toISOString(),
      clientsProcessed: clients.length,
      summary: results,
    },
  });

  return NextResponse.json({
    processed: clients.length,
    results,
  });
}
