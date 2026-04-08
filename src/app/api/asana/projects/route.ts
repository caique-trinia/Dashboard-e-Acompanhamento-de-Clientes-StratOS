import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/asana/projects";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
