"use client";
// In-browser data store with Supabase passthrough.
// If Supabase env vars are present, queries hit Supabase via the browser client.
// Otherwise we operate in "demo mode" from localStorage so the app is usable instantly.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lead, LeadHistory, Project, Task, OrgSettings, LeadStatus, LeadTemp, PipelineStage, ProjectStage } from "@/types";
import { DEFAULT_WEIGHTS } from "./scoring";
import { normalizePhone } from "./utils";
import { resolveTimezone } from "./timezones";
import { SAMPLE_LEADS, SAMPLE_TASKS, SAMPLE_HISTORY, SAMPLE_PROJECTS } from "./sample-data";

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface StoreState {
  leads: Lead[];
  history: LeadHistory[];
  projects: Project[];
  tasks: Task[];
  settings: OrgSettings;
  seeded: boolean;

  loadSampleData: () => void;
  wipe: () => void;

  addLead: (lead: Partial<Lead>) => Lead;
  addLeadsBulk: (leads: Partial<Lead>[]) => number;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  bulkUpdate: (ids: string[], patch: Partial<Lead>) => void;
  bulkDelete: (ids: string[]) => void;

  addHistory: (entry: Partial<LeadHistory> & { lead_id: string }) => void;

  addProject: (p: Partial<Project>) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addTask: (t: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  updateSettings: (patch: Partial<OrgSettings>) => void;
}

const DEFAULT_SETTINGS: OrgSettings = {
  org_id: "demo",
  call_window_start: 9,
  call_window_end: 18,
  boost_tue_thu: true,
  revival_attempts: 6,
  old_days: 30,
  scoring: DEFAULT_WEIGHTS,
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() { return new Date().toISOString(); }

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      leads: [],
      history: [],
      projects: [],
      tasks: [],
      settings: DEFAULT_SETTINGS,
      seeded: false,

      loadSampleData: () => {
        set({
          leads: SAMPLE_LEADS,
          history: SAMPLE_HISTORY,
          projects: SAMPLE_PROJECTS,
          tasks: SAMPLE_TASKS,
          seeded: true,
        });
      },

      wipe: () => set({ leads: [], history: [], projects: [], tasks: [], seeded: false }),

      addLead: (lead) => {
        const newLead: Lead = {
          id: uid(),
          org_id: "demo",
          owner_id: null,
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
        return newLead;
      },

      addLeadsBulk: (leads) => {
        const created = leads.map((l) => {
          const lead = { ...l };
          return {
            id: uid(),
            org_id: "demo",
            owner_id: null,
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

      addHistory: (entry) => {
        const h: LeadHistory = {
          id: uid(),
          lead_id: entry.lead_id,
          org_id: "demo",
          by_user: null,
          type: entry.type ?? "call",
          disposition: entry.disposition ?? null,
          note: entry.note ?? null,
          meta: entry.meta ?? {},
          created_at: nowIso(),
        };
        // Side effects: increment attempts if call, update last_contact_at
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
      },

      addProject: (p) => {
        const np: Project = {
          id: uid(),
          org_id: "demo",
          lead_id: p.lead_id ?? null,
          owner_id: null,
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
        return np;
      },
      updateProject: (id, patch) =>
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch, updated_at: nowIso() } : p)) }),
      deleteProject: (id) => set({ projects: get().projects.filter((p) => p.id !== id) }),

      addTask: (t) => {
        const nt: Task = {
          id: uid(),
          org_id: "demo",
          user_id: null,
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
        return nt;
      },
      updateTask: (id, patch) => set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      deleteTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
    }),
    { name: "helio-crm-store" }
  )
);
