"use client";
import * as React from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/leads/local-time";
import { cn, formatPhone, formatMoney, initials, relativeTime, TEMP_COLORS, STATUS_COLORS } from "@/lib/utils";
import {
  Phone, Mail, MapPin, Building, Briefcase, ArrowRight, Star,
  CalendarClock, History, Flame, Thermometer, Snowflake,
} from "lucide-react";
import type { Lead, LeadHistory, User } from "@/types";
import { MAX_ATTEMPTS } from "@/lib/lead-scheduler";

type Mode = "leads" | "calls";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  mode: Mode;
  leads?: Lead[];
  calls?: LeadHistory[];
  /** Used in "calls" mode to resolve each call's lead. */
  allLeads: Lead[];
  /** All users — used to render the owner badge on each lead row. */
  users: User[];
  /** When true, show the owner column on each lead row (admin view). */
  showOwner?: boolean;
  emptyMessage?: string;
}

/**
 * Rich drill-down dialog for KPI cards. Renders one lead-or-call per row with
 * everything an agent needs to make a decision without leaving the dashboard:
 * contact info (click-to-call / click-to-email), status & temperature, score,
 * attempts, local time, owner (admin view), last activity, and notes preview.
 *
 * Tap any row to open the full lead detail page.
 */
export function LeadDetailDialog({
  open, onOpenChange, title, subtitle, icon, mode,
  leads, calls, allLeads, users, showOwner = false, emptyMessage,
}: Props) {
  const items = mode === "leads" ? (leads ?? []) : (calls ?? []);
  const empty = items.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{icon} {title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {empty ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {emptyMessage ?? "Nothing in this bucket right now. 🎯"}
          </p>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto -mx-1 space-y-2 pr-1">
            {mode === "leads"
              ? (leads ?? []).map((l) => (
                  <LeadRow
                    key={l.id}
                    lead={l}
                    users={users}
                    showOwner={showOwner}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))
              : (calls ?? []).map((h) => {
                  const lead = allLeads.find((l) => l.id === h.lead_id);
                  if (!lead) return null;
                  return (
                    <CallRow
                      key={h.id}
                      call={h}
                      lead={lead}
                      users={users}
                      showOwner={showOwner}
                      onNavigate={() => onOpenChange(false)}
                    />
                  );
                })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function tempIcon(t: Lead["temperature"]) {
  if (t === "Hot")  return <Flame className="h-3 w-3" />;
  if (t === "Warm") return <Thermometer className="h-3 w-3" />;
  return <Snowflake className="h-3 w-3" />;
}

function LeadRow({
  lead, users, showOwner, onNavigate,
}: {
  lead: Lead;
  users: User[];
  showOwner: boolean;
  onNavigate: () => void;
}) {
  const owner = users.find((u) => u.id === lead.owner_id);
  // Phones / emails as click-to-act buttons (stop link nav).
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <Link
      href={`/leads/${lead.id}`}
      onClick={onNavigate}
      className="group block rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/40 hover:shadow-elevation-2 transition-all duration-base ease-ios overflow-hidden"
    >
      <div className="p-3.5 sm:p-4">
        {/* Header row: avatar + identity + local time */}
        <div className="flex items-start gap-3">
          <span
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-elevation-1 shadow-inner-hl shrink-0"
            style={{ background: stringToColor(lead.id) }}
          >
            {initials(lead.name)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm sm:text-base truncate">{lead.name}</span>
              <Badge className={cn("text-[10px] px-1.5 py-0 gap-1", TEMP_COLORS[lead.temperature])}>
                {tempIcon(lead.temperature)} {lead.temperature}
              </Badge>
              <span className={cn("inline-flex rounded-md px-1.5 py-0 text-[10px] font-medium", STATUS_COLORS[lead.status])}>
                {lead.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {lead.title ? `${lead.title} · ` : ""}{lead.company || "—"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <LocalTime timezone={lead.timezone} city={lead.city} state={lead.state} compact />
          </div>
        </div>

        {/* Contact row — clickable phone + email */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={stop}
              className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary px-2 py-1 font-mono transition-colors"
            >
              <Phone className="h-3 w-3" /> {formatPhone(lead.phone)}
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={stop}
              className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary px-2 py-1 truncate max-w-[220px] transition-colors"
            >
              <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.email}</span>
            </a>
          )}
          {(lead.city || lead.state) && (
            <span className="inline-flex items-center gap-1 text-muted-foreground px-2 py-1">
              <MapPin className="h-3 w-3" /> {[lead.city, lead.state].filter(Boolean).join(", ")}
            </span>
          )}
          {lead.industry && (
            <span className="inline-flex items-center gap-1 text-muted-foreground px-2 py-1">
              <Building className="h-3 w-3" /> {lead.industry}
            </span>
          )}
          {lead.service_interest && (
            <span className="inline-flex items-center gap-1 text-muted-foreground px-2 py-1">
              <Briefcase className="h-3 w-3" /> {lead.service_interest}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <Stat label="Score"        value={String(lead.score ?? 0)} mono />
          <Stat label="Attempts"     value={`${lead.attempts}/${MAX_ATTEMPTS}`} mono />
          <Stat label="Last contact" value={lead.last_contact_at ? relativeTime(lead.last_contact_at) : "—"} />
          <Stat label="Next callback" value={lead.next_callback_at ? relativeTime(lead.next_callback_at) : "—"} />
        </div>

        {/* Owner + budget + notes preview */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
          {showOwner && (
            owner ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: owner.avatar_color }}
                >
                  {initials(owner.full_name)}
                </span>
                <span className="text-foreground/80">{owner.full_name}</span>
              </span>
            ) : (
              <Badge variant="outline" className="text-rose-600 border-rose-500/30 text-[10px]">Unassigned</Badge>
            )
          )}
          {lead.budget != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" /> Budget {formatMoney(lead.budget)}
            </span>
          )}
          {lead.source && <span>· Source: {lead.source}</span>}
          {lead.decision_maker && <span className="text-emerald-600">· Decision maker</span>}
          <span className="ml-auto inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open detail <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        {lead.notes && (
          <div className="mt-2.5 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground/80">Notes:</span> {lead.notes}
          </div>
        )}
      </div>
    </Link>
  );
}

function CallRow({
  call, lead, users, showOwner, onNavigate,
}: {
  call: LeadHistory;
  lead: Lead;
  users: User[];
  showOwner: boolean;
  onNavigate: () => void;
}) {
  const by = users.find((u) => u.id === call.by_user);
  const owner = users.find((u) => u.id === lead.owner_id);
  const tone =
    call.disposition === "Answered" || call.disposition === "Qualified" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
    : call.disposition === "Not Interested" || call.disposition === "Wrong Number" ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
    : call.disposition === "Callback Requested" ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
    : call.disposition === "Voicemail" ? "bg-sky-500/10 text-sky-600 border-sky-500/30"
    : "bg-muted text-muted-foreground border-border";
  return (
    <Link
      href={`/leads/${lead.id}`}
      onClick={onNavigate}
      className="group block rounded-xl border border-border/60 bg-card hover:bg-accent/40 hover:border-primary/40 hover:shadow-elevation-2 transition-all duration-base ease-ios overflow-hidden"
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          <span
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-elevation-1 shadow-inner-hl shrink-0"
            style={{ background: stringToColor(lead.id) }}
          >
            {initials(lead.name)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm sm:text-base truncate">{lead.name}</span>
              <Badge className={cn("text-[10px] px-1.5 py-0 gap-1", TEMP_COLORS[lead.temperature])}>
                {tempIcon(lead.temperature)} {lead.temperature}
              </Badge>
              <span className={cn("inline-flex rounded-md px-1.5 py-0 text-[10px] font-medium", STATUS_COLORS[lead.status])}>
                {lead.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {lead.title ? `${lead.title} · ` : ""}{lead.company || "—"}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", tone)}>
              <History className="h-3 w-3" /> {call.disposition || call.type}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{relativeTime(call.created_at)}</div>
          </div>
        </div>

        {/* Call note */}
        {call.note && (
          <div className="mt-2.5 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground/80">Note:</span> {call.note}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <Phone className="h-3 w-3" /> <span className="font-mono">{formatPhone(lead.phone)}</span>
            </a>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {new Date(call.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
          {by && (
            <span className="inline-flex items-center gap-1.5">
              by{" "}
              <span
                className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: by.avatar_color }}
              >
                {initials(by.full_name)}
              </span>
              <span className="text-foreground/80">{by.full_name}</span>
            </span>
          )}
          {showOwner && owner && by?.id !== owner.id && (
            <span className="inline-flex items-center gap-1.5">
              owner{" "}
              <span
                className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ background: owner.avatar_color }}
              >
                {initials(owner.full_name)}
              </span>
              <span className="text-foreground/80">{owner.full_name}</span>
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open lead <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-xs font-semibold mt-0.5", mono && "font-mono tabular-nums")}>{value}</div>
    </div>
  );
}

/** Stable color from a string — used so each lead gets the same avatar color. */
function stringToColor(s: string): string {
  const palette = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}
