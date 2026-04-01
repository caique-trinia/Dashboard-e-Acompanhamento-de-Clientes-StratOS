-- ============================================================
-- StratOS Dashboard — Políticas RLS
-- Modelo: usuários autenticados têm acesso total.
-- Unauthenticated = sem acesso.
-- ai_audit_log = append-only (sem UPDATE/DELETE).
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- clients
-- ============================================================
CREATE POLICY "clients_authenticated_all"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- module_libraries
-- ============================================================
CREATE POLICY "module_libraries_authenticated_all"
  ON module_libraries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- module_tasks
-- ============================================================
CREATE POLICY "module_tasks_authenticated_all"
  ON module_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- sprints
-- ============================================================
CREATE POLICY "sprints_authenticated_all"
  ON sprints FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- sprint_tasks
-- ============================================================
CREATE POLICY "sprint_tasks_authenticated_all"
  ON sprint_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- meeting_notes
-- ============================================================
CREATE POLICY "meeting_notes_authenticated_all"
  ON meeting_notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- ai_audit_log — APPEND-ONLY
-- Authenticated users can INSERT and SELECT, but NOT UPDATE or DELETE.
-- Service role (cron) bypasses RLS automatically.
-- ============================================================
CREATE POLICY "audit_log_authenticated_select"
  ON ai_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "audit_log_authenticated_insert"
  ON ai_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Explicitamente sem policy de UPDATE e DELETE para ai_audit_log
-- = nenhum usuário autenticado pode modificar ou apagar entradas do log.
