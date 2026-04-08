-- Migration 005: Sprint goals, meeting types, and action items
-- Execute no SQL Editor do Supabase

-- Sprint: adicionar campo goal
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS goal TEXT;

-- Meeting: adicionar tipo de reunião
ALTER TABLE meeting_notes
  ADD COLUMN IF NOT EXISTS meeting_type TEXT
    CHECK(meeting_type IN ('planning','checkin','retrospective','kickoff','review','other'));

-- Tabela de action items (permite query cross-meeting por cliente)
CREATE TABLE IF NOT EXISTS meeting_action_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID REFERENCES meeting_notes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assignee    TEXT,
  due_date    DATE,
  done        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage action items"
  ON meeting_action_items FOR ALL TO authenticated USING (true);
