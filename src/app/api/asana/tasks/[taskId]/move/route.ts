import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moveTaskToSection } from "@/lib/asana/tasks";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { taskId } = await params;
  const body = await req.json();
  const { sectionGid, clientId } = body;

  if (!sectionGid) return NextResponse.json({ error: "sectionGid obrigatório" }, { status: 400 });

  try {
    await moveTaskToSection(taskId, sectionGid);

    // Log if triggered manually from UI
    if (clientId) {
      await supabase.from("ai_audit_log").insert({
        client_id: clientId,
        action_type: "task_moved",
        triggered_by: "user",
        actor_user_id: user.id,
        asana_task_id: taskId,
        asana_action: { type: "move", toSectionGid: sectionGid },
        success: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
