-- ============================================================
-- StratOS Dashboard — Schema inicial
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  context_notes       TEXT,
  asana_project_id    TEXT NOT NULL,
  asana_project_name  TEXT,
  health_score        INTEGER CHECK (health_score BETWEEN 0 AND 100),
  health_summary      TEXT,
  health_updated_at   TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_clients_created_by ON clients(created_by);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELA: module_libraries
-- ============================================================
CREATE TABLE IF NOT EXISTS module_libraries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  name        TEXT NOT NULL,
  description TEXT,
  file_name   TEXT NOT NULL,
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task_count  INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- TABELA: module_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS module_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id          UUID NOT NULL REFERENCES module_libraries(id) ON DELETE CASCADE,
  task_number         TEXT NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  section             TEXT NOT NULL DEFAULT '',
  manual_section      TEXT,
  parent_task_number  TEXT,
  parent_id           UUID REFERENCES module_tasks(id) ON DELETE SET NULL,
  depth               INTEGER NOT NULL DEFAULT 0,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  UNIQUE (library_id, task_number)
);

CREATE INDEX idx_module_tasks_library ON module_tasks(library_id);
CREATE INDEX idx_module_tasks_parent ON module_tasks(parent_id);
CREATE INDEX idx_module_tasks_section ON module_tasks(section);

-- ============================================================
-- TABELA: sprints
-- ============================================================
CREATE TABLE IF NOT EXISTS sprints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  start_date       DATE,
  end_date         DATE,
  status           TEXT NOT NULL DEFAULT 'planning'
                     CHECK (status IN ('planning', 'active', 'completed')),
  meeting_context  TEXT,
  asana_section_id TEXT,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sprints_client ON sprints(client_id);
CREATE INDEX idx_sprints_status ON sprints(status);

-- ============================================================
-- TABELA: sprint_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS sprint_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sprint_id        UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  module_task_id   UUID REFERENCES module_tasks(id) ON DELETE SET NULL,
  asana_task_id    TEXT,
  name             TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'pushed', 'in_progress', 'completed')),
  asana_section_id TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sprint_tasks_sprint ON sprint_tasks(sprint_id);
CREATE INDEX idx_sprint_tasks_asana ON sprint_tasks(asana_task_id);

-- ============================================================
-- TABELA: meeting_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sprint_id   UUID REFERENCES sprints(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_meeting_notes_client ON meeting_notes(client_id);

-- ============================================================
-- TABELA: ai_audit_log (append-only — sem UPDATE/DELETE via RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id            UUID REFERENCES clients(id) ON DELETE SET NULL,
  sprint_id            UUID REFERENCES sprints(id) ON DELETE SET NULL,
  action_type          TEXT NOT NULL CHECK (action_type IN (
                          'follow_up_comment',
                          'task_moved',
                          'task_created',
                          'health_analysis',
                          'sprint_suggestion',
                          'cron_run_started',
                          'cron_run_completed',
                          'cron_run_failed'
                        )),
  triggered_by         TEXT NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'manual', 'user')),
  actor_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt_summary       TEXT,
  ai_response_summary  TEXT,
  asana_task_id        TEXT,
  asana_action         JSONB,
  success              BOOLEAN NOT NULL DEFAULT true,
  error_message        TEXT,
  metadata             JSONB
);

CREATE INDEX idx_ai_audit_client ON ai_audit_log(client_id);
CREATE INDEX idx_ai_audit_created ON ai_audit_log(created_at DESC);
CREATE INDEX idx_ai_audit_action_type ON ai_audit_log(action_type);
