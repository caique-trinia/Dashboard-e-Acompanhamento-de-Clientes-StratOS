-- Adiciona coluna asana_workspace_id na tabela clients
-- Execute no SQL Editor do Supabase

ALTER TABLE clients ADD COLUMN IF NOT EXISTS asana_workspace_id TEXT;
