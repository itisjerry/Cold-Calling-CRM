export type UserRole = "admin" | "agent";

export type LeadStatus =
  | "New"
  | "Attempting"
  | "Connected"
  | "In Discussion"
  | "Follow-up"
  | "Qualified"
  | "Not Interested"
  | "Dead";

export type LeadTemp = "Hot" | "Warm" | "Cold";

export type PipelineStage =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal"
  | "Won"
  | "Lost";

export type ProjectStage =
  | "Discovery"
  | "Proposal"
  | "Contract"
  | "Kickoff"
  | "Active"
  | "Delivered"
  | "On Hold";

export type Disposition =
  | "Answered"
  | "Voicemail"
  | "No Answer"
  | "Busy"
  | "Callback Requested"
  | "Qualified"
  | "Send Info"
  | "Not Interested"
  | "Wrong Number";

export interface User {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  avatar_color: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  /** Demo-only credential. Never sent over the wire — used by the local picker form. */
  password?: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
}

export interface Lead {
  id: string;
  org_id: string;
  owner_id: string | null;
  name: string;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;
  industry: string | null;
  service_interest: string | null;
  source: string | null;
  tags: string[];
  status: LeadStatus;
  temperature: LeadTemp;
  pipeline: PipelineStage;
  score: number;
  attempts: number;
  budget: number | null;
  decision_maker: boolean;
  next_callback_at: string | null;
  last_contact_at: string | null;
  notes: string | null;
  /** Auto-scheduled next attempt time (algorithm). Null = ready now / sandbox / done. */
  next_attempt_at: string | null;
  /** True once attempts >= max_attempts and lead exhausted active rotation. */
  sandboxed: boolean;
  /** Reason captured when status set to "Not Interested". */
  not_interested_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Chat message between admin and agent. May tag a lead or project. */
export interface Message {
  id: string;
  org_id: string;
  /** Sender id */
  from_user: string;
  /** Recipient id */
  to_user: string;
  body: string;
  lead_id: string | null;
  project_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  org_id: string;
  by_user: string | null;
  type: "call" | "note" | "status" | "stage" | "import" | "assign";
  disposition: string | null;
  note: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  lead_id: string | null;
  owner_id: string | null;
  name: string;
  stage: ProjectStage;
  value: number | null;
  start_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  user_id: string | null;
  assigned_by: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  lead_id: string | null;
  project_id: string | null;
  done: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  org_id: string;
  user_id: string;
  created_by: string | null;
  message: string;
  fires_at: string;
  lead_id: string | null;
  project_id: string | null;
  done: boolean;
  created_at: string;
}

export interface UpdateRequest {
  id: string;
  org_id: string;
  requester_id: string;
  agent_id: string;
  lead_id: string | null;
  project_id: string | null;
  question: string;
  reply: string | null;
  status: "pending" | "answered" | "acknowledged";
  due_at: string | null;
  answered_at: string | null;
  created_at: string;
}

export type NotificationKind =
  | "lead_assigned"
  | "task_assigned"
  | "reminder"
  | "update_request"
  | "update_reply"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  org_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  org_id: string;
  actor_id: string | null;
  kind: string;
  target_table: string | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface SavedView {
  id: string;
  org_id: string;
  user_id: string;
  scope: "leads" | "tasks" | "projects" | "activity" | "reports";
  name: string;
  query: ViewQuery;
  shared: boolean;
  created_at: string;
}

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_30_days"
  | "all_time"
  | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start?: string;
  end?: string;
}

export interface ViewQuery {
  dateRange?: DateRange;
  filters?: Record<string, unknown>;
  sort?: { field: string; dir: "asc" | "desc" };
  groupBy?: string | null;
}

export interface OrgBranding {
  logoDataUrl?: string | null;
  org_name?: string;
  primary_color?: string;
  accent_color?: string;
  ink_color?: string;
  footer_text?: string;
  signature_name?: string;
  signature_title?: string;
}

export interface OrgSettings {
  org_id: string;
  call_window_start: number;
  call_window_end: number;
  boost_tue_thu: boolean;
  revival_attempts: number;
  old_days: number;
  scoring: ScoringWeights;
  branding?: OrgBranding;
  dispositions?: string[];
  pipeline_stages?: string[];
}

export interface ScoringWeights {
  hot: number;
  warm: number;
  cold: number;
  recencyMax: number;
  recencyDecayDays: number;
  callbackToday: number;
  callbackOverdue: number;
  tueThuBoost: number;
  inWindowBoost: number;
  attemptPenalty: number;
  staleAgePenalty: number;
}
