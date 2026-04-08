import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("client_id") as string | null;
  const sprintId = formData.get("sprint_id") as string | null;
  const meetingType = formData.get("meeting_type") as string | null;
  const titleOverride = formData.get("title") as string | null;

  if (!file || !clientId) {
    return NextResponse.json({ error: "file e client_id são obrigatórios" }, { status: 400 });
  }

  const title = titleOverride?.trim() || file.name.replace(/\.[^.]+$/, "");
  let content = "";

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // Dynamic import to avoid Next.js bundling issues with pdf-parse
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      content = parsed.text?.trim() ?? "";
      if (!content) {
        return NextResponse.json({ error: "Não foi possível extrair texto do PDF." }, { status: 422 });
      }
    } catch (err) {
      return NextResponse.json({ error: `Erro ao ler PDF: ${(err as Error).message}` }, { status: 500 });
    }
  } else if (
    file.type === "text/markdown" ||
    file.name.endsWith(".md") ||
    file.type === "text/plain"
  ) {
    content = await file.text();
  } else {
    return NextResponse.json({ error: "Formato não suportado. Use PDF ou .md" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meeting_notes")
    .insert({
      client_id: clientId,
      sprint_id: sprintId || null,
      title,
      content,
      meeting_type: meetingType || null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
