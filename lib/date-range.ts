import type { DateRange, DateRangePreset } from "@/types";

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "all_time", label: "All time" },
  { value: "custom", label: "Custom range" },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as week start
  x.setDate(x.getDate() + diff);
  return x;
}
function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x;
}
function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return endOfDay(x);
}
function startOfQuarter(d: Date): Date {
  const m = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), m, 1);
}

export interface ResolvedRange {
  start: Date;
  end: Date;
  label: string;
}

export function resolveDateRange(range?: DateRange): ResolvedRange {
  const now = new Date();
  const r = range ?? { preset: "last_7_days" as const };
  const preset = r.preset;

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now), label: "Today" };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y), label: "Yesterday" };
    }
    case "last_7_days": {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 6);
      return { start: s, end: endOfDay(now), label: "Last 7 days" };
    }
    case "this_week":
      return { start: startOfWeek(now), end: endOfDay(now), label: "This week" };
    case "last_week": {
      const s = startOfWeek(now);
      const lastEnd = new Date(s);
      lastEnd.setDate(lastEnd.getDate() - 1);
      const lastStart = startOfWeek(lastEnd);
      return { start: lastStart, end: endOfDay(lastEnd), label: "Last week" };
    }
    case "this_month":
      return { start: startOfMonth(now), end: endOfDay(now), label: "This month" };
    case "last_month": {
      const s = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const e = endOfMonth(s);
      return { start: s, end: e, label: "Last month" };
    }
    case "this_quarter":
      return { start: startOfQuarter(now), end: endOfDay(now), label: "This quarter" };
    case "last_30_days": {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 29);
      return { start: s, end: endOfDay(now), label: "Last 30 days" };
    }
    case "all_time":
      return { start: new Date(0), end: endOfDay(now), label: "All time" };
    case "custom": {
      const s = r.start ? new Date(r.start) : startOfDay(now);
      const e = r.end ? new Date(r.end) : endOfDay(now);
      return {
        start: startOfDay(s),
        end: endOfDay(e),
        label: `${formatDate(s)} – ${formatDate(e)}`,
      };
    }
  }
}

export function formatDate(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function withinRange(iso: string | null | undefined, range: ResolvedRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}
