export type UserRole = "admin" | "manager" | "caller";

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
  created_at: string;
  updated_at: string;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  org_id: string;
  by_user: string | null;
  type: "call" | "note" | "status" | "stage" | "import";
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
  title: string;
  description: string | null;
  due_at: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  lead_id: string | null;
  project_id: string | null;
  done: boolean;
  created_at: string;
}

export interface OrgSettings {
  org_id: string;
  call_window_start: number;
  call_window_end: number;
  boost_tue_thu: boolean;
  revival_attempts: number;
  old_days: number;
  scoring: ScoringWeights;
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
