/**
 * Lead lifecycle scheduler.
 *
 * Given a disposition + lead history + org settings, returns the next attempt
 * time, status update, sandbox flag, and a human-readable rationale.
 *
 * Rules (best-practice cadence — short gaps, never months):
 *
 *   Disposition           → status               next-attempt offset (hrs)   notes
 *   ─────────────────────────────────────────────────────────────────────────────
 *   Answered              → Connected            null (agent advances)       no auto reattempt
 *   In-Discussion start   → In Discussion        null                        new pipeline starts
 *   Qualified             → Qualified            null                        done — moves to pipeline
 *   Send Info             → In Discussion        +48                         after info digestion
 *   Voicemail             → Attempting           +20–24h, time-shifted       try a fresh time-of-day
 *   No Answer             → Attempting           +4–6h same day if window    rotate slot otherwise
 *   Busy                  → Attempting           +1–2h                       same day same slot
 *   Callback Requested    → Follow-up            user-supplied callback      respect agent input
 *   Not Interested        → Not Interested       null                        moves to NI section
 *   Wrong Number          → Dead                 null                        out
 *
 * Sandbox: once attempts >= MAX_ATTEMPTS (10) and lead still hasn't escaped
 * (Connected / In Discussion / Qualified / Won / Lost / Not Interested),
 * the lead is sandboxed (no further auto-scheduling; surfaced in /sandbox).
 *
 * Best time-of-day selection: rotates through morning (10), midday (13),
 * late-afternoon (16) buckets in the LEAD's local timezone, picking the
 * bucket NOT recently tried so we vary the touchpoint.
 */

import type { Disposition, Lead, LeadHistory, LeadStatus, OrgSettings } from "@/types";
import { localDayHour } from "./timezones";

export const MAX_ATTEMPTS = 10;

const HOUR_BUCKETS = [10, 13, 16] as const; // morning, midday, late-afternoon (lead-local)

export interface ScheduleResult {
  /** ISO timestamp for next attempt, or null if no auto reattempt. */
  next_attempt_at: string | null;
  /** New status to apply to the lead. */
  status: LeadStatus;
  /** True if lead exhausted attempts and should leave active rotation. */
  sandboxed: boolean;
  /** True if this disposition created a fresh pipeline branch. */
  branchedPipeline: boolean;
  /** Human-readable rationale for what happened. */
  rationale: string;
}

/**
 * Decide what happens to a lead after a call attempt with the given disposition.
 * Pure function — does not mutate the lead.
 */
export function scheduleNextAttempt(
  lead: Lead,
  disposition: Disposition,
  history: LeadHistory[],
  settings: OrgSettings,
  /** Optional explicit callback time (only honored for Callback Requested). */
  callbackAt?: string | null,
  /** Reference time for calculations — defaults to now. Useful in tests. */
  now: Date = new Date(),
): ScheduleResult {
  const attemptsAfter = lead.attempts + 1; // we are logging this attempt
  const tz = lead.timezone ?? "America/New_York";
  const winStart = settings.call_window_start ?? 9;
  const winEnd = settings.call_window_end ?? 18;

  // Terminal dispositions
  if (disposition === "Qualified") {
    return {
      next_attempt_at: null,
      status: "Qualified",
      sandboxed: false,
      branchedPipeline: true,
      rationale: "Qualified — moved into pipeline. No further auto-attempts.",
    };
  }
  if (disposition === "Not Interested") {
    return {
      next_attempt_at: null,
      status: "Not Interested",
      sandboxed: false,
      branchedPipeline: false,
      rationale: "Marked Not Interested — visible in Not-Interested view.",
    };
  }
  if (disposition === "Wrong Number") {
    return {
      next_attempt_at: null,
      status: "Dead",
      sandboxed: false,
      branchedPipeline: false,
      rationale: "Wrong number — lead retired.",
    };
  }
  if (disposition === "Answered") {
    return {
      next_attempt_at: null,
      status: "Connected",
      sandboxed: false,
      branchedPipeline: true,
      rationale: "Answered — conversation begins. New pipeline branch active.",
    };
  }
  if (disposition === "Callback Requested") {
    const at = callbackAt ?? addHours(now, 24).toISOString();
    return {
      next_attempt_at: at,
      status: "Follow-up",
      sandboxed: false,
      branchedPipeline: false,
      rationale: `Callback honored for ${formatLocal(at, tz)}.`,
    };
  }
  if (disposition === "Send Info") {
    const at = nextAttemptAtBucket(now, tz, winStart, winEnd, 48, history, lead.id);
    return {
      next_attempt_at: at,
      status: "In Discussion",
      sandboxed: false,
      branchedPipeline: true,
      rationale: `Info sent — follow-up scheduled ${formatLocal(at, tz)}.`,
    };
  }

  // Sandbox check (after the terminal cases — those leave rotation cleanly).
  if (attemptsAfter >= MAX_ATTEMPTS) {
    return {
      next_attempt_at: null,
      status: "Attempting",
      sandboxed: true,
      branchedPipeline: false,
      rationale: `Reached ${MAX_ATTEMPTS} attempts — moved to Sandbox for revival review.`,
    };
  }

  // No-contact dispositions: short, varied retry cadence.
  let offsetHours: number;
  if (disposition === "Busy") offsetHours = 2;
  else if (disposition === "No Answer") offsetHours = 5;
  else if (disposition === "Voicemail") offsetHours = 22;
  else offsetHours = 24;

  const at = nextAttemptAtBucket(now, tz, winStart, winEnd, offsetHours, history, lead.id);
  return {
    next_attempt_at: at,
    status: "Attempting",
    sandboxed: false,
    branchedPipeline: false,
    rationale: `${disposition} — next attempt ${formatLocal(at, tz)} (lead-local).`,
  };
}

/**
 * Pick the next attempt time:
 *   1. Start from now + offsetHours
 *   2. Snap to the lead-local hour bucket (10/13/16) that wasn't most-recently tried
 *   3. If snapped time falls outside call window or weekend, push to next valid slot
 */
function nextAttemptAtBucket(
  now: Date,
  tz: string,
  winStart: number,
  winEnd: number,
  offsetHours: number,
  history: LeadHistory[],
  leadId: string,
): string {
  // Find which bucket was used last for THIS lead — pick a different one.
  const recent = history
    .filter((h) => h.lead_id === leadId && h.type === "call")
    .slice(0, 3);
  const recentHours = recent
    .map((h) => localDayHour(tz, new Date(h.created_at)).hour)
    .filter((h) => Number.isFinite(h));
  const recentBucket = recentHours.length > 0 ? closestBucket(recentHours[0]) : null;
  const candidateBuckets = HOUR_BUCKETS.filter((b) => b !== recentBucket);
  const targetBucket = candidateBuckets[0] ?? HOUR_BUCKETS[0];

  // Walk forward day-by-day starting at (now + offset) until we land in window + weekday + within bucket
  let cursor = addHours(now, offsetHours);
  for (let i = 0; i < 14; i++) {
    const local = localDayHour(tz, cursor);
    const isWeekend = local.day === 0 || local.day === 6;
    if (!isWeekend) {
      // Snap to target bucket on this day, but not earlier than cursor's local hour
      const snapHour = Math.max(targetBucket, local.hour);
      if (snapHour <= winEnd - 1 && snapHour >= winStart) {
        const snapped = setLocalHour(cursor, tz, snapHour);
        if (snapped.getTime() > now.getTime()) return snapped.toISOString();
      }
    }
    // Advance to next day at midnight local
    cursor = addHours(startOfNextLocalDay(cursor, tz), 8);
  }
  // Fallback — shouldn't happen
  return addHours(now, offsetHours).toISOString();
}

function closestBucket(hour: number): number {
  let best = HOUR_BUCKETS[0] as number;
  let bestDelta = Math.abs(hour - HOUR_BUCKETS[0]);
  for (const b of HOUR_BUCKETS) {
    const d = Math.abs(hour - b);
    if (d < bestDelta) { best = b; bestDelta = d; }
  }
  return best;
}

function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 3600000);
}

/**
 * Return a Date that has the given lead-local hour (minute=0) on the same lead-local day.
 * Approximates by computing the lead-local hour offset and adjusting.
 */
function setLocalHour(d: Date, tz: string, targetHour: number): Date {
  const current = localDayHour(tz, d).hour;
  const deltaHours = targetHour - current;
  return addHours(d, deltaHours);
}

function startOfNextLocalDay(d: Date, tz: string): Date {
  // Approximate next day in lead-local time by adding 24h then snapping to hour 0 local
  const next = addHours(d, 24);
  const localHour = localDayHour(tz, next).hour;
  return addHours(next, -localHour);
}

function formatLocal(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

/**
 * Classify a lead for the agent dashboard:
 *   "new"     — never attempted (attempts === 0)
 *   "old"     — attempted 1–9 times, still in rotation
 *   "sandbox" — sandboxed flag true OR attempts >= MAX_ATTEMPTS
 *   "done"    — terminal status (Qualified / Not Interested / Dead)
 */
export type LeadBucket = "new" | "old" | "sandbox" | "done";

export function bucketLead(lead: Lead): LeadBucket {
  if (lead.status === "Qualified" || lead.status === "Dead") return "done";
  if (lead.status === "Not Interested") return "done";
  if (lead.sandboxed || lead.attempts >= MAX_ATTEMPTS) return "sandbox";
  if (lead.attempts === 0) return "new";
  return "old";
}

/**
 * Is this lead due to be called today (at or before end-of-day in lead-local time)?
 * Considers next_attempt_at OR next_callback_at OR (no schedule + in-window now).
 */
export function isDueToday(lead: Lead, now: Date = new Date()): boolean {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (lead.next_attempt_at && new Date(lead.next_attempt_at) <= endOfToday) return true;
  if (lead.next_callback_at && new Date(lead.next_callback_at) <= endOfToday) return true;

  // Fallback for un-scheduled leads (just imported, never called): due if currently in window
  if (!lead.next_attempt_at && !lead.next_callback_at && lead.attempts === 0) return true;

  return false;
}

/** Priority score for sorting today's call list. Higher = call sooner. */
export function todayPriority(
  lead: Lead,
  settings: OrgSettings,
  now: Date = new Date(),
): number {
  const tz = lead.timezone ?? "America/New_York";
  const winStart = settings.call_window_start ?? 9;
  const winEnd = settings.call_window_end ?? 18;
  const local = localDayHour(tz, now);
  const inWindow = local.hour >= winStart && local.hour < winEnd;

  let score = 0;
  // Temperature
  if (lead.temperature === "Hot") score += 100;
  else if (lead.temperature === "Warm") score += 60;
  else score += 30;

  // In their local window right now
  if (inWindow) score += 80;

  // Time-of-day match for prior touch (call them when they previously answered)
  // (No deep history use here; the scheduler already biased the slot.)

  // Overdue boost
  const due =
    lead.next_attempt_at ? new Date(lead.next_attempt_at).getTime()
    : lead.next_callback_at ? new Date(lead.next_callback_at).getTime()
    : null;
  if (due !== null) {
    const minutesPastDue = (now.getTime() - due) / 60000;
    if (minutesPastDue >= 0) score += Math.min(80, 30 + minutesPastDue / 30);
    else score += Math.max(0, 40 - Math.abs(minutesPastDue) / 60); // closer to due = higher
  }

  // Slight penalty per attempt (we want fresh leads first when tied)
  score -= lead.attempts * 4;

  return Math.round(score);
}
