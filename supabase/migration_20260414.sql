-- ============================================
-- YapiMap Migration 2026-04-14
-- Supabase SQL Editor ausführen
-- ============================================

-- profiles: neue Felder
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tax_number TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

-- projects: neue Felder
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS payment_plan TEXT,
  ADD COLUMN IF NOT EXISTS handover_date DATE,
  ADD COLUMN IF NOT EXISTS citizenship_eligible BOOLEAN DEFAULT FALSE;

-- project_documents: bis zu 5 Docs pro Projekt
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Docs lesen" ON project_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.developer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('broker', 'admin'))
  );

CREATE POLICY "Docs einfügen" ON project_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.developer_id = auth.uid())
  );

CREATE POLICY "Docs löschen" ON project_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.developer_id = auth.uid())
  );
