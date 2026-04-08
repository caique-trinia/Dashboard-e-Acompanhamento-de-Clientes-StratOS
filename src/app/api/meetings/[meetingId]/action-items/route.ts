import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { meetingId } = await params;
  const { data, error } = await supabase
    .from("meeting_action_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { meetingId } = await params;
  const body = await req.json();
  const { description, assignee, due_date } = body;

  if (!description) {
    return NextResponse.json({ error: "description é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meeting_action_items")
    .insert({
      meeting_id: meetingId,
      description,
      assignee: assignee ?? null,
      due_date: due_date ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
