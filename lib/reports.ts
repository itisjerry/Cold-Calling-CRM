// Report data aggregation utilities — shared by HTML preview and PDF renderer.
import type { Lead, LeadHistory, User, Project, Task, DateRange } from "@/types";
import { resolveDateRange, withinRange, type ResolvedRange } from "./date-range";

export type ReportTemplate =
  | "daily-activity"
  | "weekly-performance"
  | "monthly-leadership"
  | "pipeline-health"
  | "source-roi"
  | "agent-scorecard"
  | "all-agents-comparison"
  | "custom";

export interface ReportFilters {
  agentIds: string[] | null; // null = all agents
  sources: string[] | null;
  statuses: string[] | null;
  tempFilter: string[] | null;
}

export interface ReportInput {
  template: ReportTemplate;
  range: DateRange;
  filters: ReportFilters;
  leads: Lead[];
  history: LeadHistory[];
  projects: Project[];
  tasks: Task[];
  users: User[];
}

export interface AgentRow {
  user: User;
  dials: number;
  connects: number;
  rate: number;
  voicemails: number;
  callbacks: number;
  qualified: number;
  notInterested: number;
  totalLeads: number;
  hotLeads: number;
  pipelineValue: number;
}

export interface DispositionBucket { label: string; count: number; pct: number; }
export interface SourceBucket { label: string; total: number; qualified: number; conversion: number; value: number; }
export interface HourBucket { hour: number; calls: number; connects: number; rate: number; }
export interface DayBucket { date: string; label: string; calls: number; connects: number; qualified: number; }

export interface ReportData {
  template: ReportTemplate;
  range: ResolvedRange;
  filters: ReportFilters;
  totals: {
    dials: number;
    connects: number;
    connectRate: number;
    qualified: number;
    callbacksBooked: number;
    voicemails: number;
    notInterested: number;
    totalLeads: number;
    hotLeads: number;
    pipelineValue: number;
    wonValue: number;
    avgAttempts: number;
  };
  byDay: DayBucket[];
  byHour: HourBucket[];
  byDisposition: DispositionBucket[];
  bySource: SourceBucket[];
  byAgent: AgentRow[];
  funnel: { stage: string; count: number }[];
  topLeads: Lead[];
}

export function aggregateReport(input: ReportInput): ReportData {
  const { range, filters, leads, history, users } = input;
  const resolved = resolveDateRange(range);

  // Filter leads by source/temp
  const matchAgent = (id: string | null) =>
    !filters.agentIds || filters.agentIds.length === 0 || (id && filters.agentIds.includes(id));
  const matchSource = (s: string | null) =>
    !filters.sources || filters.sources.length === 0 || (s && filters.sources.includes(s));
  const matchStatus = (s: string) =>
    !filters.statuses || filters.statuses.length === 0 || filters.statuses.includes(s);
  const matchTemp = (t: string) =>
    !filters.tempFilter || filters.tempFilter.length === 0 || filters.tempFilter.includes(t);

  const scopedLeads = leads.filter((l) => matchAgent(l.owner_id) && matchSource(l.source) && matchStatus(l.status) && matchTemp(l.temperature));
  const scopedLeadIds = new Set(scopedLeads.map((l) => l.id));

  // History within date range, scoped to filtered leads
  const scopedHistory = history.filter((h) => {
    if (!withinRange(h.created_at, resolved)) return false;
    if (filters.agentIds && filters.agentIds.length > 0) {
      // event must be by a filtered agent OR on a filtered lead
      if (h.by_user && !filters.agentIds.includes(h.by_user) && !scopedLeadIds.has(h.lead_id)) return false;
    }
    return true;
  });

  const callHistory = scopedHistory.filter((h) => h.type === "call");

  const dials = callHistory.length;
  const connectDispos = ["Answered", "Qualified", "Send Info", "Callback Requested", "In Discussion"];
  const connects = callHistory.filter((h) => h.disposition && connectDispos.includes(h.disposition)).length;
  const qualified = callHistory.filter((h) => h.disposition === "Qualified").length;
  const callbacksBooked = callHistory.filter((h) => h.disposition === "Callback Requested").length;
  const voicemails = callHistory.filter((h) => h.disposition === "Voicemail").length;
  const notInterested = callHistory.filter((h) => h.disposition === "Not Interested").length;
  const connectRate = dials > 0 ? Math.round((connects / dials) * 100) : 0;

  const hotLeads = scopedLeads.filter((l) => l.temperature === "Hot").length;
  const pipelineValue = scopedLeads.reduce((s, l) => s + (l.budget ?? 0), 0);
  const wonValue = scopedLeads.filter((l) => l.pipeline === "Won").reduce((s, l) => s + (l.budget ?? 0), 0);
  const avgAttempts = scopedLeads.length > 0
    ? Math.round((scopedLeads.reduce((s, l) => s + l.attempts, 0) / scopedLeads.length) * 10) / 10
    : 0;

  // By day
  const byDay: DayBucket[] = [];
  const dayCount = Math.min(
    90,
    Math.max(1, Math.ceil((resolved.end.getTime() - resolved.start.getTime()) / 86400000) + 1)
  );
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(resolved.start);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    if (d > resolved.end) break;
    const inDay = callHistory.filter((h) => {
      const t = new Date(h.created_at);
      return t >= d && t < next;
    });
    byDay.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calls: inDay.length,
      connects: inDay.filter((h) => h.disposition && connectDispos.includes(h.disposition)).length,
      qualified: inDay.filter((h) => h.disposition === "Qualified").length,
    });
  }

  // By hour
  const byHour: HourBucket[] = [];
  for (let h = 0; h < 24; h++) {
    const inHour = callHistory.filter((x) => new Date(x.created_at).getHours() === h);
    const cInHour = inHour.filter((x) => x.disposition && connectDispos.includes(x.disposition)).length;
    byHour.push({
      hour: h,
      calls: inHour.length,
      connects: cInHour,
      rate: inHour.length > 0 ? Math.round((cInHour / inHour.length) * 100) : 0,
    });
  }

  // By disposition
  const dispoMap = new Map<string, number>();
  callHistory.forEach((h) => {
    if (h.disposition) dispoMap.set(h.disposition, (dispoMap.get(h.disposition) ?? 0) + 1);
  });
  const byDisposition: DispositionBucket[] = Array.from(dispoMap.entries())
    .map(([label, count]) => ({ label, count, pct: dials > 0 ? Math.round((count / dials) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  // By source
  const sourceMap = new Map<string, { total: number; qualified: number; value: number }>();
  scopedLeads.forEach((l) => {
    const key = l.source ?? "Unknown";
    const cur = sourceMap.get(key) ?? { total: 0, qualified: 0, value: 0 };
    cur.total += 1;
    if (l.status === "Qualified" || l.pipeline === "Won") cur.qualified += 1;
    cur.value += l.budget ?? 0;
    sourceMap.set(key, cur);
  });
  const bySource: SourceBucket[] = Array.from(sourceMap.entries())
    .map(([label, v]) => ({
      label,
      total: v.total,
      qualified: v.qualified,
      conversion: v.total > 0 ? Math.round((v.qualified / v.total) * 100) : 0,
      value: v.value,
    }))
    .sort((a, b) => b.total - a.total);

  // By agent
  const byAgent: AgentRow[] = users
    .filter((u) => u.role === "agent" && (!filters.agentIds || filters.agentIds.length === 0 || filters.agentIds.includes(u.id)))
    .map((u) => {
      const myCalls = callHistory.filter((h) => h.by_user === u.id);
      const myConn = myCalls.filter((h) => h.disposition && connectDispos.includes(h.disposition)).length;
      const myQual = myCalls.filter((h) => h.disposition === "Qualified").length;
      const myCB = myCalls.filter((h) => h.disposition === "Callback Requested").length;
      const myVM = myCalls.filter((h) => h.disposition === "Voicemail").length;
      const myNI = myCalls.filter((h) => h.disposition === "Not Interested").length;
      const myLeads = scopedLeads.filter((l) => l.owner_id === u.id);
      return {
        user: u,
        dials: myCalls.length,
        connects: myConn,
        rate: myCalls.length > 0 ? Math.round((myConn / myCalls.length) * 100) : 0,
        voicemails: myVM,
        callbacks: myCB,
        qualified: myQual,
        notInterested: myNI,
        totalLeads: myLeads.length,
        hotLeads: myLeads.filter((l) => l.temperature === "Hot").length,
        pipelineValue: myLeads.reduce((s, l) => s + (l.budget ?? 0), 0),
      };
    })
    .sort((a, b) => b.qualified - a.qualified || b.connects - a.connects || b.dials - a.dials);

  // Funnel
  const STAGES = ["New", "Attempting", "Connected", "In Discussion", "Follow-up", "Qualified"];
  const funnel = STAGES.map((stage) => ({
    stage,
    count: scopedLeads.filter((l) => l.status === stage).length,
  }));

  // Top leads (by score / temperature / budget)
  const topLeads = scopedLeads
    .slice()
    .sort((a, b) => {
      const tempRank = (t: string) => (t === "Hot" ? 2 : t === "Warm" ? 1 : 0);
      return (
        tempRank(b.temperature) - tempRank(a.temperature) ||
        (b.budget ?? 0) - (a.budget ?? 0) ||
        b.attempts - a.attempts
      );
    })
    .slice(0, 10);

  return {
    template: input.template,
    range: resolved,
    filters,
    totals: {
      dials, connects, connectRate, qualified, callbacksBooked, voicemails, notInterested,
      totalLeads: scopedLeads.length, hotLeads, pipelineValue, wonValue, avgAttempts,
    },
    byDay, byHour, byDisposition, bySource, byAgent, funnel, topLeads,
  };
}

export const REPORT_TEMPLATE_META: Record<ReportTemplate, { label: string; description: string }> = {
  "daily-activity":         { label: "Daily Activity",        description: "Day-by-day calls, dispositions, hot leads. Best for end-of-day reviews." },
  "weekly-performance":     { label: "Weekly Performance",    description: "Per-agent breakdown for the period with connect rate and quals." },
  "monthly-leadership":     { label: "Monthly Leadership",    description: "Pipeline velocity, won $, source ROI, and forecast for execs." },
  "pipeline-health":        { label: "Pipeline Health",       description: "Stage counts, funnel, aging leads, won/lost trend." },
  "source-roi":             { label: "Lead Source ROI",       description: "Conversion rate and value by source." },
  "agent-scorecard":        { label: "Agent Scorecard",       description: "Deep dive on a single agent — best for 1:1 coaching." },
  "all-agents-comparison":  { label: "All-Agents Comparison", description: "Side-by-side ranking of every agent across KPIs." },
  "custom":                 { label: "Custom",                description: "Pick the metrics and charts you want." },
};
