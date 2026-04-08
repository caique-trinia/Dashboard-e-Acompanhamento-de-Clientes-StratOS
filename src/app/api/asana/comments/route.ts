import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addComment } from "@/lib/asana/comments";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { taskId, text, clientId } = body;

  if (!taskId || !text) {
    return NextResponse.json({ error: "taskId e text são obrigatórios" }, { status: 400 });
  }

  try {
    const story = await addComment(taskId, text);

    if (clientId) {
      await supabase.from("ai_audit_log").insert({
        client_id: clientId,
        action_type: "follow_up_comment",
        triggered_by: "user",
        actor_user_id: user.id,
        asana_task_id: taskId,
        asana_action: { type: "comment", text },
        success: true,
      });
    }

    return NextResponse.json(story, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
