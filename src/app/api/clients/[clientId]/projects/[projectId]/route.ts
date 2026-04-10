import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; projectId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { clientId, projectId } = await params;

  // Don't allow deleting the last project
  const { count } = await supabase
    .from("client_asana_projects")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Não é possível remover o único projeto do cliente." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("client_asana_projects")
    .delete()
    .eq("id", projectId)
    .eq("client_id", clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
