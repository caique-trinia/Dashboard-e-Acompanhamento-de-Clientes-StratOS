/**
 * StratOS — Cron scheduler
 * Roda como processo separado ao lado do `next dev`.
 * Executa todo no toda segunda-feira às 09:00 (fuso do servidor).
 *
 * Iniciar: npx ts-node scripts/start-cron.ts
 * Ou via: npm run cron
 */

import * as cron from "node-cron";

// Carregar variáveis de ambiente locais se dotenv estiver disponível
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({ path: ".env.local" });
} catch {
  // dotenv not installed — assume env vars are set externally
}

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

if (!CRON_SECRET) {
  console.error("[cron] ERRO: CRON_SECRET não definido. Configure em .env.local");
  process.exit(1);
}

async function runWeeklyJob() {
  console.log(`[cron] ${new Date().toISOString()} — Iniciando job semanal...`);

  try {
    const res = await fetch(`${APP_URL}/api/cron/weekly`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cron-Secret": CRON_SECRET!,
      },
    });

    const body = await res.json();

    if (!res.ok) {
      console.error("[cron] Erro na API:", body);
      return;
    }

    console.log(`[cron] Concluído. Clientes processados: ${body.processed}`);
    if (body.results) {
      for (const r of body.results) {
        console.log(`  - ${r.name}: ${r.actionsExecuted} ações${r.errors.length ? ` | Erros: ${r.errors.join("; ")}` : ""}`);
      }
    }
  } catch (err) {
    console.error("[cron] Falha ao chamar API:", err);
  }
}

// Toda segunda-feira às 09:00
cron.schedule("0 9 * * 1", runWeeklyJob, {
  timezone: "America/Sao_Paulo",
});

console.log("[cron] Scheduler iniciado. Próxima execução: segunda-feira às 09:00 (Brasília)");
console.log(`[cron] App URL: ${APP_URL}`);

// Manter o processo vivo
process.on("SIGINT", () => {
  console.log("[cron] Encerrado.");
  process.exit(0);
});
