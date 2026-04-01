import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseModuleCsv } from "@/lib/modules/csv-parser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const libraryName = formData.get("libraryName") as string | null;

  if (!file || !libraryName) {
    return NextResponse.json({ error: "file e libraryName são obrigatórios" }, { status: 400 });
  }

  const csvContent = await file.text();

  let tasks;
  try {
    tasks = parseModuleCsv(csvContent);
  } catch (err) {
    return NextResponse.json({ error: `Erro ao parsear CSV: ${(err as Error).message}` }, { status: 422 });
  }

  if (tasks.length === 0) {
    return NextResponse.json({ error: "CSV vazio ou sem dados válidos" }, { status: 422 });
  }

  // Create library record
  const { data: library, error: libError } = await supabase
    .from("module_libraries")
    .insert({
      name: libraryName,
      file_name: file.name,
      imported_by: user.id,
      task_count: tasks.length,
    })
    .select()
    .single();

  if (libError || !library) {
    return NextResponse.json({ error: libError?.message ?? "Erro ao criar biblioteca" }, { status: 500 });
  }

  // Bulk insert tasks (first pass — without parent_id)
  const taskRows = tasks.map((t) => ({
    library_id: library.id,
    task_number: t.taskNumber,
    name: t.name,
    description: t.description || null,
    section: t.section,
    manual_section: t.manualSection,
    parent_task_number: t.parentTaskNumber,
    depth: t.depth,
    sort_order: t.sortOrder,
  }));

  // Insert in batches of 500 to avoid payload limits
  const BATCH_SIZE = 500;
  for (let i = 0; i < taskRows.length; i += BATCH_SIZE) {
    const batch = taskRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("module_tasks").insert(batch);
    if (error) {
      // Rollback: delete the library (cascades to tasks)
      await supabase.from("module_libraries").delete().eq("id", library.id);
      return NextResponse.json({ error: `Erro ao inserir tarefas: ${error.message}` }, { status: 500 });
    }
  }

  // Second pass: resolve parent_id from parent_task_number using raw SQL via RPC
  // We call a stored procedure or do it client-side to avoid needing Supabase RPC setup.
  // Instead, fetch all tasks and do the resolution in JS:
  const { data: insertedTasks } = await supabase
    .from("module_tasks")
    .select("id, task_number, parent_task_number")
    .eq("library_id", library.id);

  if (insertedTasks) {
    const numberToId = new Map(insertedTasks.map((t) => [t.task_number, t.id]));
    const updates = insertedTasks
      .filter((t) => t.parent_task_number)
      .map((t) => ({
        id: t.id,
        parent_id: numberToId.get(t.parent_task_number!) ?? null,
      }))
      .filter((u) => u.parent_id);

    // Update parent_id in batches
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      for (const u of batch) {
        await supabase
          .from("module_tasks")
          .update({ parent_id: u.parent_id })
          .eq("id", u.id);
      }
    }
  }

  return NextResponse.json({ libraryId: library.id, taskCount: tasks.length }, { status: 201 });
}
