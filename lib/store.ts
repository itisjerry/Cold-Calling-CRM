"use client";
// In-browser data store with Supabase passthrough.
// If Supabase env vars are present, queries hit Supabase via the browser client.
// Otherwise we operate in "demo mode" from localStorage so the app is usable instantly.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Lead, LeadHistory, Project, Task, OrgSettings, LeadStatus, LeadTemp, PipelineStage, ProjectStage,
  User, Reminder, UpdateRequest, Notification, ActivityEvent, SavedView, OrgBranding, NotificationKind,
} from "@/types";
import { DEFAULT_WEIGHTS } from "./scoring";
import { normalizePhone } from "./utils";
import { resolveTimezone } from "./timezones";
import {
  SAMPLE_LEADS, SAMPLE_TASKS, SAMPLE_HISTORY, SAMPLE_PROJECTS, SAMPLE_USERS,
} from "./sample-data";

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface StoreState {
  // identity
  currentUserId: string;
  users: User[];

  // core entities
  leads: Lead[];
  history: LeadHistory[];
  projects: Project[];
  tasks: Task[];
  reminders: Reminder[];
  updateRequests: UpdateRequest[];
  notifications: Notification[];
  activity: ActivityEvent[];
  savedViews: SavedView[];

  settings: OrgSettings;
  seeded: boolean;

  // identity actions
  setCurrentUser: (id: string) => void;
  addUser: (u: Partial<User>) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  deactivateUser: (id: string) => void;

  loadSampleData: () => void;
  wipe: () => void;

  // leads
  addLead: (lead: Partial<Lead>) => Lead;
  addLeadsBulk: (leads: Partial<Lead>[]) => number;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  bulkUpdate: (ids: string[], patch: Partial<Lead>) => void;
  bulkDelete: (ids: string[]) => void;
  assignLead: (leadId: string, agentId: string, note?: string) => void;
  assignLeadsBulk: (leadIds: string[], agentId: string) => void;
  roundRobinAssign: (leadIds: string[], agentIds: string[]) => void;

  // history
  addHistory: (entry: Partial<LeadHistory> & { lead_id: string }) => void;

  // projects
  addProject: (p: Partial<Project>) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // tasks
  addTask: (t: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  assignTask: (taskId: string, agentId: string) => void;

  // reminders
  addReminder: (r: Partial<Reminder> & { user_id: string; message: string; fires_at: string }) => Reminder;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  // update requests
  createUpdateRequest: (r: Partial<UpdateRequest> & { agent_id: string; question: string }) => UpdateRequest;
  replyUpdateRequest: (id: string, reply: string) => void;
  acknowledgeUpdateRequest: (id: string) => void;

  // notifications
  pushNotification: (n: Partial<Notification> & { user_id: string; kind: NotificationKind; title: string }) => Notification;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  clearNotification: (id: string) => void;

  // activity feed
  logActivity: (e: Partial<ActivityEvent> & { kind: string }) => void;

  // saved views
  saveView: (v: Partial<SavedView> & { name: string; scope: SavedView["scope"]; query: SavedView["query"] }) => SavedView;
  deleteView: (id: string) => void;

  // settings
  updateSettings: (patch: Partial<OrgSettings>) => void;
  updateBranding: (patch: Partial<OrgBranding>) => void;
}

const DEFAULT_BRANDING: OrgBranding = {
  org_name: "Pixel Architecture",
  primary_color: "#4f46e5",
  accent_color: "#0ea5e9",
  ink_color: "#0f172a",
  footer_text: "Pixel Architecture — Confidential",
  signature_name: "Yahya Malik",
  signature_title: "Founder",
};

const DEFAULT_DISPOSITIONS = [
  "Answered", "Voicemail", "No Answer", "Busy",
  "Callback Requested", "Qualified", "Send Info", "Not Interested", "Wrong Number",
];

const DEFAULT_PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const DEFAULT_SETTINGS: OrgSettings = {
  org_id: "demo",
  call_window_start: 9,
  call_window_end: 18,
  boost_tue_thu: true,
  revival_attempts: 6,
  old_days: 30,
  scoring: DEFAULT_WEIGHTS,
  branding: DEFAULT_BRANDING,
  dispositions: DEFAULT_DISPOSITIONS,
  pipeline_stages: DEFAULT_PIPELINE_STAGES,
};

function uid(prefix = "") {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() { return new Date().toISOString(); }

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUserId: "user-admin",
      users: SAMPLE_USERS,

      leads: [],
      history: [],
      projects: [],
      tasks: [],
      reminders: [],
      updateRequests: [],
      notifications: [],
      activity: [],
      savedViews: [],

      settings: DEFAULT_SETTINGS,
      seeded: false,

      setCurrentUser: (id) => set({ currentUserId: id }),

      addUser: (u) => {
        const user: User = {
          id: u.id ?? uid("user-"),
          org_id: "demo",
          full_name: u.full_name ?? "Unnamed",
          email: u.email ?? "",
          avatar_color: u.avatar_color ?? randomColor(),
          role: u.role ?? "agent",
          active: u.active ?? true,
          created_at: nowIso(),
        };
        set({ users: [...get().users, user] });
        return user;
      },

      updateUser: (id, patch) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }),

      deactivateUser: (id) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, active: false } : u)) }),

      loadSampleData: () => {
        // assign sample leads round-robin to agent users
        const agentIds = SAMPLE_USERS.filter((u) => u.role === "agent").map((u) => u.id);
        const leads = SAMPLE_LEADS.map((l, i) => ({
          ...l,
          owner_id: agentIds[i % agentIds.length],
        }));
        // assign sample tasks round-robin
        const tasks = SAMPLE_TASKS.map((t, i) => ({
          ...t,
          user_id: agentIds[i % agentIds.length],
          assigned_by: "user-admin",
        }));
        // sample projects to first agent
        const projects = SAMPLE_PROJECTS.map((p) => ({ ...p, owner_id: agentIds[0] ?? null }));

        // seed a couple of activity events + a reminder + an update request
        const now = nowIso();
        const reminders: Reminder[] = [
          {
            id: uid("rem-"),
            org_id: "demo",
            user_id: agentIds[0] ?? "user-sara",
            created_by: "user-admin",
            message: "Don't forget to follow up with Marcus Chen before EOD.",
            fires_at: new Date(Date.now() + 4 * 3600000).toISOString(),
            lead_id: leads[0]?.id ?? null,
            project_id: null,
            done: false,
            created_at: now,
          },
        ];
        const updateRequests: UpdateRequest[] = [
          {
            id: uid("ur-"),
            org_id: "demo",
            requester_id: "user-admin",
            agent_id: agentIds[0] ?? "user-sara",
            lead_id: leads[2]?.id ?? null,
            project_id: null,
            question: "Where are we with this lead? Did we book the callback?",
            reply: null,
            status: "pending",
            due_at: new Date(Date.now() + 24 * 3600000).toISOString(),
            answered_at: null,
            created_at: now,
          },
        ];
        const notifications: Notification[] = [
          {
            id: uid("n-"),
            user_id: agentIds[0] ?? "user-sara",
            org_id: "demo",
            kind: "update_request",
            title: "Update requested",
            body: "Yahya asked for an update on a lead.",
            link: "/inbox",
            read_at: null,
            created_at: now,
          },
        ];
        const activity: ActivityEvent[] = [
          {
            id: uid("ev-"),
            org_id: "demo",
            actor_id: "user-admin",
            kind: "sample_data_loaded",
            target_table: null,
            target_id: null,
            payload: { leads: leads.length, tasks: tasks.length },
            created_at: now,
          },
        ];

        set({
          leads,
          history: SAMPLE_HISTORY,
          projects,
          tasks,
          reminders,
          updateRequests,
          notifications,
          activity,
          seeded: true,
        });
      },

      wipe: () =>
        set({
          leads: [], history: [], projects: [], tasks: [],
          reminders: [], updateRequests: [], notifications: [], activity: [],
          seeded: false,
        }),

      addLead: (lead) => {
        const newLead: Lead = {
          id: uid(),
          org_id: "demo",
          owner_id: lead.owner_id ?? null,
          name: lead.name || "Unnamed",
          company: lead.company ?? null,
          title: lead.title ?? null,
          email: lead.email ?? null,
          phone: lead.phone ?? null,
          phone_normalized: lead.phone ? normalizePhone(lead.phone) : null,
          city: lead.city ?? null,
          state: lead.state ?? null,
          country: lead.country ?? null,
          timezone: lead.timezone ?? resolveTimezone(lead.city, lead.state, lead.country),
          industry: lead.industry ?? null,
          service_interest: lead.service_interest ?? null,
          source: lead.source ?? null,
          tags: lead.tags ?? [],
          status: (lead.status as LeadStatus) ?? "New",
          temperature: (lead.temperature as LeadTemp) ?? "Warm",
          pipeline: (lead.pipeline as PipelineStage) ?? "New",
          score: 0,
          attempts: lead.attempts ?? 0,
          budget: lead.budget ?? null,
          decision_maker: lead.decision_maker ?? false,
          next_callback_at: lead.next_callback_at ?? null,
          last_contact_at: lead.last_contact_at ?? null,
          notes: lead.notes ?? null,
          created_at: lead.created_at ?? nowIso(),
          updated_at: nowIso(),
        };
        set({ leads: [newLead, ...get().leads] });
        get().logActivity({ kind: "lead_created", target_table: "leads", target_id: newLead.id, payload: { name: newLead.name } });
        return newLead;
      },

      addLeadsBulk: (leads) => {
        const created = leads.map((l) => {
          const lead = { ...l };
          return {
            id: uid(),
            org_id: "demo",
            owner_id: lead.owner_id ?? null,
            name: lead.name || "Unnamed",
            company: lead.company ?? null,
            title: lead.title ?? null,
            email: lead.email ?? null,
            phone: lead.phone ?? null,
            phone_normalized: lead.phone ? normalizePhone(lead.phone) : null,
            city: lead.city ?? null,
            state: lead.state ?? null,
            country: lead.country ?? null,
            timezone: lead.timezone ?? resolveTimezone(lead.city, lead.state, lead.country),
            industry: lead.industry ?? null,
            service_interest: lead.service_interest ?? null,
            source: lead.source ?? null,
            tags: lead.tags ?? [],
            status: (lead.status as LeadStatus) ?? "New",
            temperature: (lead.temperature as LeadTemp) ?? "Warm",
            pipeline: (lead.pipeline as PipelineStage) ?? "New",
            score: 0,
            attempts: 0,
            budget: lead.budget ?? null,
            decision_maker: lead.decision_maker ?? false,
            next_callback_at: null,
            last_contact_at: null,
            notes: lead.notes ?? null,
            created_at: nowIso(),
            updated_at: nowIso(),
          } as Lead;
        });
        set({ leads: [...created, ...get().leads] });
        get().logActivity({ kind: "leads_imported", payload: { count: created.length } });
        return created.length;
      },

      updateLead: (id, patch) => {
        set({
          leads: get().leads.map((l) => (l.id === id ? { ...l, ...patch, updated_at: nowIso() } : l)),
        });
      },

      deleteLead: (id) => {
        set({
          leads: get().leads.filter((l) => l.id !== id),
          history: get().history.filter((h) => h.lead_id !== id),
        });
      },

      bulkUpdate: (ids, patch) => {
        const set2 = new Set(ids);
        set({
          leads: get().leads.map((l) => (set2.has(l.id) ? { ...l, ...patch, updated_at: nowIso() } : l)),
        });
      },
      bulkDelete: (ids) => {
        const set2 = new Set(ids);
        set({
          leads: get().leads.filter((l) => !set2.has(l.id)),
          history: get().history.filter((h) => !set2.has(h.lead_id)),
        });
      },

      assignLead: (leadId, agentId, note) => {
        const actor = get().currentUserId;
        const lead = get().leads.find((l) => l.id === leadId);
        if (!lead) return;
        set({
          leads: get().leads.map((l) =>
            l.id === leadId ? { ...l, owner_id: agentId, updated_at: nowIso() } : l
          ),
          history: [
            {
              id: uid("h-"),
              lead_id: leadId,
              org_id: "demo",
              by_user: actor,
              type: "assign",
              disposition: null,
              note: note ?? `Reassigned to ${agentId}`,
              meta: { from: lead.owner_id, to: agentId },
              created_at: nowIso(),
            },
            ...get().history,
          ],
        });
        const agent = get().users.find((u) => u.id === agentId);
        get().pushNotification({
          user_id: agentId,
          kind: "lead_assigned",
          title: "New lead assigned to you",
          body: `${lead.name}${lead.company ? ` · ${lead.company}` : ""}${note ? ` — ${note}` : ""}`,
          link: `/leads/${leadId}`,
        });
        get().logActivity({
          kind: "lead_assigned",
          target_table: "leads",
          target_id: leadId,
          payload: { agent_id: agentId, agent_name: agent?.full_name, lead_name: lead.name },
        });
      },

      assignLeadsBulk: (leadIds, agentId) => {
        const actor = get().currentUserId;
        const idSet = new Set(leadIds);
        set({
          leads: get().leads.map((l) =>
            idSet.has(l.id) ? { ...l, owner_id: agentId, updated_at: nowIso() } : l
          ),
        });
        const agent = get().users.find((u) => u.id === agentId);
        get().pushNotification({
          user_id: agentId,
          kind: "lead_assigned",
          title: `${leadIds.length} leads assigned to you`,
          body: `${leadIds.length} new leads added to your queue.`,
          link: `/leads`,
        });
        get().logActivity({
          kind: "leads_assigned_bulk",
          payload: { agent_id: agentId, agent_name: agent?.full_name, count: leadIds.length },
        });
      },

      roundRobinAssign: (leadIds, agentIds) => {
        if (agentIds.length === 0) return;
        const updates: Record<string, string> = {};
        leadIds.forEach((id, i) => {
          updates[id] = agentIds[i % agentIds.length];
        });
        set({
          leads: get().leads.map((l) =>
            updates[l.id] ? { ...l, owner_id: updates[l.id], updated_at: nowIso() } : l
          ),
        });
        // group notifications
        const buckets: Record<string, number> = {};
        Object.values(updates).forEach((aid) => { buckets[aid] = (buckets[aid] ?? 0) + 1; });
        Object.entries(buckets).forEach(([aid, count]) => {
          get().pushNotification({
            user_id: aid,
            kind: "lead_assigned",
            title: `${count} leads assigned to you`,
            body: `Round-robin distribution from admin.`,
            link: `/leads`,
          });
        });
        get().logActivity({
          kind: "leads_round_robin",
          payload: { count: leadIds.length, agents: agentIds.length },
        });
      },

      addHistory: (entry) => {
        const actor = get().currentUserId;
        const h: LeadHistory = {
          id: uid(),
          lead_id: entry.lead_id,
          org_id: "demo",
          by_user: entry.by_user ?? actor,
          type: entry.type ?? "call",
          disposition: entry.disposition ?? null,
          note: entry.note ?? null,
          meta: entry.meta ?? {},
          created_at: nowIso(),
        };
        set({
          history: [h, ...get().history],
          leads: get().leads.map((l) =>
            l.id === entry.lead_id
              ? {
                  ...l,
                  attempts: h.type === "call" ? l.attempts + 1 : l.attempts,
                  last_contact_at: h.type === "call" ? h.created_at : l.last_contact_at,
                  updated_at: nowIso(),
                }
              : l
          ),
        });
        if (h.type === "call") {
          get().logActivity({
            kind: "call_logged",
            target_table: "leads",
            target_id: entry.lead_id,
            payload: { disposition: h.disposition },
          });
        }
      },

      addProject: (p) => {
        const np: Project = {
          id: uid(),
          org_id: "demo",
          lead_id: p.lead_id ?? null,
          owner_id: p.owner_id ?? null,
          name: p.name || "Untitled Project",
          stage: (p.stage as ProjectStage) ?? "Discovery",
          value: p.value ?? null,
          start_date: p.start_date ?? new Date().toISOString().slice(0, 10),
          due_date: p.due_date ?? null,
          notes: p.notes ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        set({ projects: [np, ...get().projects] });
        get().logActivity({ kind: "project_created", target_table: "projects", target_id: np.id, payload: { name: np.name } });
        return np;
      },
      updateProject: (id, patch) =>
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch, updated_at: nowIso() } : p)) }),
      deleteProject: (id) => set({ projects: get().projects.filter((p) => p.id !== id) }),

      addTask: (t) => {
        const actor = get().currentUserId;
        const nt: Task = {
          id: uid(),
          org_id: "demo",
          user_id: t.user_id ?? actor,
          assigned_by: t.assigned_by ?? actor,
          title: t.title || "Untitled",
          description: t.description ?? null,
          due_at: t.due_at ?? null,
          priority: t.priority ?? "medium",
          lead_id: t.lead_id ?? null,
          project_id: t.project_id ?? null,
          done: t.done ?? false,
          created_at: nowIso(),
        };
        set({ tasks: [nt, ...get().tasks] });
        if (nt.user_id && nt.user_id !== actor) {
          get().pushNotification({
            user_id: nt.user_id,
            kind: "task_assigned",
            title: "New task assigned",
            body: nt.title,
            link: `/tasks`,
          });
        }
        get().logActivity({
          kind: "task_created",
          target_table: "tasks",
          target_id: nt.id,
          payload: { title: nt.title, assignee: nt.user_id },
        });
        return nt;
      },
      updateTask: (id, patch) => set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      deleteTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
      assignTask: (taskId, agentId) => {
        set({ tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, user_id: agentId } : t)) });
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) {
          get().pushNotification({
            user_id: agentId,
            kind: "task_assigned",
            title: "Task assigned to you",
            body: task.title,
            link: `/tasks`,
          });
        }
      },

      addReminder: (r) => {
        const actor = get().currentUserId;
        const nr: Reminder = {
          id: uid("rem-"),
          org_id: "demo",
          user_id: r.user_id,
          created_by: r.created_by ?? actor,
          message: r.message,
          fires_at: r.fires_at,
          lead_id: r.lead_id ?? null,
          project_id: r.project_id ?? null,
          done: false,
          created_at: nowIso(),
        };
        set({ reminders: [nr, ...get().reminders] });
        if (nr.user_id !== actor) {
          get().pushNotification({
            user_id: nr.user_id,
            kind: "reminder",
            title: "Reminder set for you",
            body: nr.message,
            link: `/reminders`,
          });
        }
        get().logActivity({
          kind: "reminder_set",
          target_table: "reminders",
          target_id: nr.id,
          payload: { for: nr.user_id, fires_at: nr.fires_at },
        });
        return nr;
      },
      updateReminder: (id, patch) =>
        set({ reminders: get().reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),
      deleteReminder: (id) => set({ reminders: get().reminders.filter((r) => r.id !== id) }),

      createUpdateRequest: (r) => {
        const actor = get().currentUserId;
        const ur: UpdateRequest = {
          id: uid("ur-"),
          org_id: "demo",
          requester_id: r.requester_id ?? actor,
          agent_id: r.agent_id,
          lead_id: r.lead_id ?? null,
          project_id: r.project_id ?? null,
          question: r.question,
          reply: null,
          status: "pending",
          due_at: r.due_at ?? null,
          answered_at: null,
          created_at: nowIso(),
        };
        set({ updateRequests: [ur, ...get().updateRequests] });
        get().pushNotification({
          user_id: ur.agent_id,
          kind: "update_request",
          title: "Update requested",
          body: ur.question.slice(0, 120),
          link: `/inbox`,
        });
        get().logActivity({
          kind: "update_requested",
          target_table: "update_requests",
          target_id: ur.id,
          payload: { agent: ur.agent_id, lead: ur.lead_id },
        });
        return ur;
      },
      replyUpdateRequest: (id, reply) => {
        const ur = get().updateRequests.find((r) => r.id === id);
        if (!ur) return;
        set({
          updateRequests: get().updateRequests.map((r) =>
            r.id === id ? { ...r, reply, status: "answered", answered_at: nowIso() } : r
          ),
        });
        get().pushNotification({
          user_id: ur.requester_id,
          kind: "update_reply",
          title: "Update received",
          body: reply.slice(0, 120),
          link: `/admin/activity`,
        });
        get().logActivity({
          kind: "update_replied",
          target_table: "update_requests",
          target_id: id,
          payload: { agent: ur.agent_id },
        });
      },
      acknowledgeUpdateRequest: (id) =>
        set({
          updateRequests: get().updateRequests.map((r) =>
            r.id === id ? { ...r, status: "acknowledged" } : r
          ),
        }),

      pushNotification: (n) => {
        const note: Notification = {
          id: uid("n-"),
          user_id: n.user_id,
          org_id: "demo",
          kind: n.kind,
          title: n.title,
          body: n.body ?? null,
          link: n.link ?? null,
          read_at: null,
          created_at: nowIso(),
        };
        set({ notifications: [note, ...get().notifications] });
        return note;
      },
      markNotificationRead: (id) =>
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read_at: nowIso() } : n
          ),
        }),
      markAllNotificationsRead: (userId) =>
        set({
          notifications: get().notifications.map((n) =>
            n.user_id === userId && !n.read_at ? { ...n, read_at: nowIso() } : n
          ),
        }),
      clearNotification: (id) =>
        set({ notifications: get().notifications.filter((n) => n.id !== id) }),

      logActivity: (e) => {
        const actor = get().currentUserId;
        const ev: ActivityEvent = {
          id: uid("ev-"),
          org_id: "demo",
          actor_id: e.actor_id ?? actor,
          kind: e.kind,
          target_table: e.target_table ?? null,
          target_id: e.target_id ?? null,
          payload: e.payload ?? {},
          created_at: nowIso(),
        };
        // cap activity log at 500 entries to keep localStorage reasonable
        const trimmed = [ev, ...get().activity].slice(0, 500);
        set({ activity: trimmed });
      },

      saveView: (v) => {
        const actor = get().currentUserId;
        const sv: SavedView = {
          id: uid("v-"),
          org_id: "demo",
          user_id: v.user_id ?? actor,
          scope: v.scope,
          name: v.name,
          query: v.query,
          shared: v.shared ?? false,
          created_at: nowIso(),
        };
        set({ savedViews: [sv, ...get().savedViews] });
        return sv;
      },
      deleteView: (id) =>
        set({ savedViews: get().savedViews.filter((v) => v.id !== id) }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      updateBranding: (patch) =>
        set({
          settings: {
            ...get().settings,
            branding: { ...(get().settings.branding ?? DEFAULT_BRANDING), ...patch },
          },
        }),
    }),
    { name: "helio-crm-store" }
  )
);

function randomColor(): string {
  const palette = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];
  return palette[Math.floor(Math.random() * palette.length)];
}

// Selectors / role helpers
export function useCurrentUser() {
  return useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);
}
export function useIsAdmin() {
  return useStore((s) => {
    const u = s.users.find((x) => x.id === s.currentUserId);
    return u?.role === "admin";
  });
}
export function useAgents() {
  return useStore((s) => s.users.filter((u) => u.role === "agent" && u.active));
}
