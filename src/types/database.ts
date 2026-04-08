export type ActionType =
  | "follow_up_comment"
  | "task_moved"
  | "task_created"
  | "health_analysis"
  | "sprint_suggestion"
  | "cron_run_started"
  | "cron_run_completed"
  | "cron_run_failed";

export type TriggeredBy = "cron" | "manual" | "user";

export type SprintStatus = "planning" | "active" | "completed";

export type SprintTaskStatus = "pending" | "pushed" | "in_progress" | "completed";

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  context_notes: string | null;
  asana_project_id: string;
  asana_project_name: string | null;
  asana_workspace_id: string | null;
  health_score: number | null;
  health_summary: string | null;
  health_updated_at: string | null;
  is_active: boolean;
  created_by: string | null;
}

export interface ModuleLibrary {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  file_name: string;
  imported_by: string | null;
  task_count: number;
}

export interface ModuleTask {
  id: string;
  library_id: string;
  task_number: string;
  name: string;
  description: string | null;
  section: string;
  manual_section: string | null;
  parent_task_number: string | null;
  parent_id: string | null;
  depth: number;
  sort_order: number;
}

export interface Sprint {
  id: string;
  created_at: string;
  client_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: SprintStatus;
  meeting_context: string | null;
  asana_section_id: string | null;
  created_by: string | null;
}

export interface SprintTask {
  id: string;
  created_at: string;
  sprint_id: string;
  module_task_id: string | null;
  asana_task_id: string | null;
  name: string;
  description: string | null;
  status: SprintTaskStatus;
  asana_section_id: string | null;
  sort_order: number;
}

export interface MeetingNote {
  id: string;
  created_at: string;
  client_id: string;
  sprint_id: string | null;
  title: string;
  content: string;
  uploaded_by: string | null;
}

export interface AiAuditLog {
  id: string;
  created_at: string;
  client_id: string | null;
  sprint_id: string | null;
  action_type: ActionType;
  triggered_by: TriggeredBy;
  actor_user_id: string | null;
  prompt_summary: string | null;
  ai_response_summary: string | null;
  asana_task_id: string | null;
  asana_action: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}
