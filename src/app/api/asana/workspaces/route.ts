import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { asanaFetch } from "@/lib/asana/client";
import type { AsanaWorkspace } from "@/types/asana";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const workspaces = await asanaFetch<AsanaWorkspace[]>("/workspaces?opt_fields=gid,name");
    return NextResponse.json(workspaces);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
