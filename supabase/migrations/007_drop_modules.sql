-- Migration 007: Drop module tables
-- Run AFTER deploying the code that removes all module references

ALTER TABLE sprint_tasks DROP COLUMN IF EXISTS module_task_id;
DROP TABLE IF EXISTS module_tasks CASCADE;
DROP TABLE IF EXISTS module_libraries CASCADE;
