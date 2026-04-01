export interface AsanaProject {
  gid: string;
  name: string;
  workspace?: { gid: string; name: string };
}

export interface AsanaSection {
  gid: string;
  name: string;
}

export interface AsanaMembership {
  project: { gid: string };
  section: { gid: string; name: string } | null;
}

export interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  due_on: string | null;
  notes: string;
  memberships: AsanaMembership[];
  assignee: { gid: string; name: string } | null;
  modified_at: string;
}

export interface AsanaStory {
  gid: string;
  created_at: string;
  type: string;
  text: string;
  created_by: { gid: string; name: string };
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface CreateTaskParams {
  projectGid: string;
  name: string;
  notes?: string;
  sectionGid?: string;
  dueOn?: string;
  assigneeGid?: string;
}
