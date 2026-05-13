import type { Lead, ScoringWeights } from "@/types";
import { callWindowState, localDayHour } from "./timezones";

export const DEFAULT_WEIGHTS: ScoringWeights = {
  hot: 100, warm: 60, cold: 30,
  recencyMax: 30, recencyDecayDays: 30,
  callbackToday: 80, callbackOverdue: 60,
  tueThuBoost: 25, inWindowBoost: 20,
  attemptPenalty: 5, staleAgePenalty: 20,
};

export function scoreLead(
  lead: Lead,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  windowStart = 9,
  windowEnd = 18,
  now: Date = new Date()
): number {
  let score = 0;
  // Temperature
  if (lead.temperature === "Hot") score += weights.hot;
  else if (lead.temperature === "Warm") score += weights.warm;
  else score += weights.cold;

  // Recency: newer = bigger boost
  const ageMs = now.getTime() - new Date(lead.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, weights.recencyMax * (1 - ageDays / weights.recencyDecayDays));
  score += recencyBoost;

  // Callback due
  if (lead.next_callback_at) {
    const cb = new Date(lead.next_callback_at).getTime();
    const diff = cb - now.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (diff < 0 && Math.abs(diff) < 14 * day) score += weights.callbackOverdue;
    else if (diff >= 0 && diff < day) score += weights.callbackToday;
  }

  // Tue/Thu boost for follow-ups
  const today = now.getDay();
  if ((today === 2 || today === 4) && lead.status === "Follow-up") score += weights.tueThuBoost;

  // In window
  if (callWindowState(lead.timezone, windowStart, windowEnd) === "in") {
    score += weights.inWindowBoost;
  }

  // Attempt penalty
  score -= Math.max(0, lead.attempts - 1) * weights.attemptPenalty;

  // Stale
  if (ageDays > 60) score -= weights.staleAgePenalty;

  // Status penalties
  if (lead.status === "Dead" || lead.status === "Not Interested") score -= 200;
  if (lead.status === "Qualified") score += 30;

  return Math.round(score);
}

export function sortByScore(leads: Lead[], weights?: ScoringWeights, ws = 9, we = 18): Lead[] {
  return [...leads].sort((a, b) => scoreLead(b, weights, ws, we) - scoreLead(a, weights, ws, we));
}
