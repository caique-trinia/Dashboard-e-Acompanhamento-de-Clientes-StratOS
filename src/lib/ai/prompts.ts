import type { FollowUpContext, HealthContext } from "@/types/ai";
import type { ModuleTask } from "@/types/database";
import type { AsanaTask } from "@/types/asana";

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "?";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function buildFollowUpPrompt(ctx: FollowUpContext): string {
  const sectionsText = ctx.sections
    .map((s) => `  - GID: ${s.gid} → "${s.name}"`)
    .join("\n");

  const tasksText = ctx.asanaTasks
    .map(
      (t) =>
        `  - GID: ${t.gid} | Nome: "${t.name}" | Coluna: "${t.section_name ?? "N/A"}" | Concluída: ${t.completed} | Prazo: ${t.due_on ?? "sem prazo"}`
    )
    .join("\n");

  const commentsText =
    ctx.recentComments.length > 0
      ? ctx.recentComments
          .map((c) => `  - Tarefa "${c.taskName}": "${c.text}" (por ${c.author} em ${c.date})`)
          .join("\n")
      : "  Nenhum comentário recente.";

  // Sprint block
  const sprintBlock = ctx.activeSprint
    ? (() => {
        const s = ctx.activeSprint;
        const period =
          s.start_date || s.end_date
            ? `${formatDateBR(s.start_date)} → ${formatDateBR(s.end_date)}`
            : "sem período definido";
        return `SPRINT ATIVA: "${s.name}"
  Objetivo: ${s.goal ?? "não definido"}
  Período: ${period}`;
      })()
    : "Nenhuma sprint ativa no momento.";

  // Action items block
  const actionItemsBlock =
    ctx.openActionItems && ctx.openActionItems.length > 0
      ? ctx.openActionItems
          .map((item) => {
            const who = item.assignee ? `[${item.assignee}]` : "";
            const when = item.due_date ? ` (vence ${formatDateBR(item.due_date)})` : "";
            return `  - ${who} ${item.description}${when}`.trim();
          })
          .join("\n")
      : "  Nenhum item de ação em aberto.";

  return `Você é um gerente de contas de uma consultoria de negócios, e você basicamente faz o trabalho que o Caique deveria fazer, dessa forma você comenta e gerencia como se fosse realmente ele. Você gerencia o cliente "${ctx.clientName}".

CONTEXTO DO CLIENTE:
${ctx.clientContextNotes ?? "Sem contexto adicional."}

${sprintBlock}

ITENS DE AÇÃO EM ABERTO (de reuniões anteriores):
${actionItemsBlock}

NOTAS DAS ÚLTIMAS REUNIÕES:
${ctx.meetingContext ?? "Sem notas de reunião disponíveis."}

COLUNAS DO KANBAN DO ASANA:
${sectionsText}

TAREFAS ATUAIS DO PROJETO:
${tasksText}

COMENTÁRIOS RECENTES (últimos 7 dias):
${commentsText}

SUA TAREFA:
Analise o estado do projeto e gere uma lista JSON de ações a executar.
Cada ação deve ser uma das seguintes:

1. Adicionar comentário em uma tarefa:
   {"type": "comment", "taskGid": "...", "text": "..."}
   - Escreva em primeira pessoa como go se fosse o Caique (gerente de contas)
   - Seja específico, profissional e orientado a ações
   - Mencione as notas de reunião se relevante
   - Só comente se houver algo significativo a dizer

2. Mover uma tarefa para outra coluna:
   {"type": "move", "taskGid": "...", "toSectionGid": "..."}
   - Só mova se o estado real da tarefa justificar claramente
   - Use os GIDs exatos das colunas listadas acima

REGRAS:
- Máximo 10 comentários no total
- Máximo 3 movimentações no total
- Nunca comente em tarefas já concluídas, exceto se houver bloqueio crítico
- Seja conciso e profissional, escreva em português
- Retorne APENAS o array JSON, sem nenhum outro texto

Formato: [{"type": "comment"|"move", ...}, ...]`;
}

export function buildSuggestTasksPrompt(
  clientName: string,
  clientContextNotes: string | null,
  recentAsanaTasks: AsanaTask[],
  availableModuleTasks: ModuleTask[]
): string {
  const recentText = recentAsanaTasks
    .slice(0, 30)
    .map((t) => `  - "${t.name}" (concluída: ${t.completed})`)
    .join("\n");

  const moduleText = availableModuleTasks
    .slice(0, 200)
    .map(
      (t) =>
        `  id:${t.id} | ${t.task_number} | "${t.name}" | Seção: ${t.section}`
    )
    .join("\n");

  return `Você é um consultor de metodologia de negócios. Seu trabalho é recomendar quais tarefas da biblioteca de módulos devem ser incluídas na próxima sprint.

CLIENTE: ${clientName}
CONTEXTO DO CLIENTE: ${clientContextNotes ?? "Sem contexto."}

ATIVIDADE RECENTE DO PROJETO (últimos 30 dias):
${recentText || "  Nenhuma atividade recente."}

TAREFAS DO MÓDULO DISPONÍVEIS (ainda não adicionadas a uma sprint):
${moduleText}

Com base no momentum atual do projeto, contexto do cliente e atividade recente, sugira as tarefas mais adequadas para a próxima sprint.

Retorne um objeto JSON:
{
  "suggestions": [
    {
      "moduleTaskId": "uuid-da-tarefa",
      "reasoning": "uma frase explicando por que esta tarefa é relevante agora"
    }
  ],
  "sprintFocusSummary": "resumo em 2-3 frases do foco recomendado para a sprint"
}

Limite a 15 sugestões. Priorize tarefas que logicamente seguem o que foi recentemente concluído. Responda em português.`;
}

export function buildHealthPrompt(ctx: HealthContext): string {
  const commentsText =
    ctx.comments.length > 0
      ? ctx.comments.map((c) => `  - ${c}`).join("\n")
      : "  Nenhum comentário recente.";

  return `Você está analisando a saúde de um projeto de cliente para relatório interno.

CLIENTE: ${ctx.clientName}
CONTEXTO: ${ctx.clientContextNotes ?? "Sem contexto."}

MÉTRICAS DO PROJETO:
- Total de tarefas: ${ctx.totalTasks}
- Concluídas: ${ctx.completedTasks} (${ctx.completionPct}%)
- Atrasadas (prazo vencido): ${ctx.overdueTasks}
- Sem atividade recente (>14 dias sem comentário): ${ctx.staleCount}
- Em coluna "Bloqueado" ou equivalente: ${ctx.blockedCount}

AMOSTRA DE COMENTÁRIOS RECENTES:
${commentsText}

Forneça uma avaliação da saúde do projeto. Retorne JSON:
{
  "score": <inteiro 0-100>,
  "summary": "<avaliação de 2-3 frases para o gerente de contas>",
  "risks": ["<risco 1>", "<risco 2>"],
  "positives": ["<ponto positivo 1>"]
}

Guia de pontuação:
- 80-100: No caminho certo, bom momentum
- 60-79: Preocupações menores, gerenciáveis
- 40-59: Bloqueios ou atrasos notáveis
- 20-39: Problemas significativos que requerem atenção
- 0-19: Problemas críticos

Responda em português.`;
}
