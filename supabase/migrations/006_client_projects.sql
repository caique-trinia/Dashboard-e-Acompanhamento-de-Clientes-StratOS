-- Migration 006: client_asana_projects
-- Supports multiple Asana projects per client (tabs in client detail page)

CREATE TABLE IF NOT EXISTS client_asana_projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_gid  TEXT NOT NULL,
  project_name TEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, project_gid)
);

ALTER TABLE client_asana_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth" ON client_asana_projects
  FOR ALL TO authenticated USING (true);

-- Migrate existing single-project data to the new table
INSERT INTO client_asana_projects (client_id, project_gid, project_name, sort_order)
SELECT id, asana_project_id, COALESCE(asana_project_name, asana_project_id), 0
FROM clients
WHERE asana_project_id IS NOT NULL
ON CONFLICT DO NOTHING;
