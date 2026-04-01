export type FollowUpActionType = "comment" | "move";

export interface FollowUpCommentAction {
  type: "comment";
  taskGid: string;
  text: string;
}

export interface FollowUpMoveAction {
  type: "move";
  taskGid: string;
  toSectionGid: string;
}

export type FollowUpAction = FollowUpCommentAction | FollowUpMoveAction;

export interface TaskSuggestion {
  moduleTaskId: string;
  reasoning: string;
}

export interface SuggestTasksResponse {
  suggestions: TaskSuggestion[];
  sprintFocusSummary: string;
}

export interface HealthAnalysisResponse {
  score: number;
  summary: string;
  risks: string[];
  positives: string[];
}

export interface FollowUpContext {
  clientName: string;
  clientContextNotes: string | null;
  asanaTasks: {
    gid: string;
    name: string;
    completed: boolean;
    section_name: string | null;
    due_on: string | null;
    notes: string;
  }[];
  recentComments: {
    taskName: string;
    text: string;
    author: string;
    date: string;
  }[];
  meetingContext: string | null;
  sections: { gid: string; name: string }[];
}

export interface HealthContext {
  clientName: string;
  clientContextNotes: string | null;
  totalTasks: number;
  completedTasks: number;
  completionPct: number;
  overdueTasks: number;
  staleCount: number;
  blockedCount: number;
  comments: string[];
}
