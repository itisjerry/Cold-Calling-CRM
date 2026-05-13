"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useCurrentUser, useIsAdmin } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/leads/local-time";
import { callWindowState, localTime } from "@/lib/timezones";
import { cn, TEMP_COLORS, daysSince } from "@/lib/utils";
import {
  Phone, Flame, Clock, ArrowRight, TrendingUp, Star, AlertTriangle, Sparkles,
  Voicemail, PhoneMissed, PhoneOff, Check, X, Send, CalendarClock, ShieldCheck,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { CountUp } from "@/components/motion/count-up";
import { TiltCard } from "@/components/motion/tilt-card";
import { StaggerList, StaggerItem } from "@/components/motion/stagger";
import { Reveal } from "@/components/motion/reveal";
import { bucketLead, isDueToday, todayPriority, MAX_ATTEMPTS } from "@/lib/lead-scheduler";

export default function DashboardPage() {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const me = useCurrentUser();
  const isAdmin = useIsAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Scope leads to current agent (admin sees all but won't see call lists)
  const myLeads = React.useMemo(
    () => (isAdmin ? leads : leads.filter((l) => l.owner_id === me?.id)),
    [leads, me?.id, isAdmin],
  );

  // Today's calls split — agent only
  const dueToday = React.useMemo(
    () => myLeads.filter((l) => bucketLead(l) !== "done" && bucketLead(l) !== "sandbox" && isDueToday(l, now)),
    [myLeads, now],
  );

  const todaysNew = React.useMemo(
    () =>
      dueToday
        .filter((l) => bucketLead(l) === "new")
        .map((l) => ({ l, p: todayPriority(l, settings, now) }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 12)
        .map((x) => x.l),
    [dueToday, settings, now],
  );

  const todaysOld = React.useMemo(
    () =>
      dueToday
        .filter((l) => bucketLead(l) === "old")
        .map((l) => ({ l, p: todayPriority(l, settings, now) }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 12)
        .map((x) => x.l),
    [dueToday, settings, now],
  );

  // KPIs
  const callsToday = history.filter((h) => h.type === "call" && new Date(h.created_at) >= todayStart && (isAdmin ? true : h.by_user === me?.id)).length;
  const sevenDays = new Date(Date.now() - 7 * 86400000);
  const recentCalls = history.filter((h) => h.type === "call" && new Date(h.created_at) >= sevenDays && (isAdmin ? true : h.by_user === me?.id));
  const connects = recentCalls.filter((h) => h.disposition === "Answered" || h.disposition === "Qualified").length;
  const connectRate = recentCalls.length > 0 ? Math.round((connects / recentCalls.length) * 100) : 0;
  const qualifiedThisWeek = myLeads.filter((l) => l.status === "Qualified" && daysSince(l.updated_at) <= 7).length;
  const hot = myLeads.filter((l) => l.temperature === "Hot" && !["Qualified", "Dead", "Not Interested"].includes(l.status)).length;
  const sandbox = myLeads.filter((l) => bucketLead(l) === "sandbox").length;

  // EOD summary — today's call dispositions
  const todaysCalls = history.filter(
    (h) => h.type === "call" && new Date(h.created_at) >= todayStart && (isAdmin ? true : h.by_user === me?.id),
  );
  const dispoCount = (d: string) => todaysCalls.filter((h) => h.disposition === d).length;
  const eod = {
    answered: dispoCount("Answered") + dispoCount("Qualified"),
    voicemail: dispoCount("Voicemail"),
    noAnswer: dispoCount("No Answer"),
    busy: dispoCount("Busy"),
    callback: dispoCount("Callback Requested"),
    sendInfo: dispoCount("Send Info"),
    notInterested: dispoCount("Not Interested"),
    qualified: dispoCount("Qualified"),
  };

  // 7-day chart
  const weekChart = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(Date.now() - i * 86400000);
      const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = history.filter(
        (h) => h.type === "call" && new Date(h.created_at) >= dayStart && new Date(h.created_at) < dayEnd && (isAdmin ? true : h.by_user === me?.id),
      ).length;
      days.push({ day: dayStart.toLocaleDateString("en-US", { weekday: "short" }), calls: count });
    }
    return days;
  }, [history, isAdmin, me?.id]);

  const greet = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
  const firstName = me?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Good {greet}, {firstName} —{" "}
            <span className="bg-gradient-to-r from-primary to-cold bg-clip-text text-transparent">
              {isAdmin ? "your team is on it." : "let's close some deals."}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {!isAdmin && (
              <> · You have <b>{todaysNew.length + todaysOld.length}</b> calls scheduled today.</>
            )}
          </p>
        </div>
        {!isAdmin && (
          <Button asChild size="lg" className="shadow-elevation-3">
            <Link href="/call-mode"><Phone className="h-4 w-4 mr-1.5" />Open Call Mode</Link>
          </Button>
        )}
        {isAdmin && (
          <Button asChild size="lg" variant="outline">
            <Link href="/admin"><ShieldCheck className="h-4 w-4 mr-1.5" />Open Command Center</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPI label="Today (new)"     value={todaysNew.length}      sub="never tried before"  icon={Sparkles} />
        <KPI label="Today (old)"     value={todaysOld.length}      sub="follow-ups due"      icon={Clock} accent="amber" />
        <KPI label="Calls today"     value={callsToday}            sub="attempts logged"     icon={Phone} />
        <KPI label="Connect rate"    value={connectRate} suffix="%" sub="last 7 days"        icon={TrendingUp} accent="emerald" />
        <KPI label="Hot in pipeline" value={hot}                   sub="need action"         icon={Flame} accent="red" />
        <KPI label="In sandbox"      value={sandbox}               sub={`10/${MAX_ATTEMPTS}+ attempts`} icon={AlertTriangle} accent="amber" />
      </div>

      {!isAdmin && (
        <div className="grid lg:grid-cols-2 gap-4">
          <CallList title="Today — New leads" subtitle="Never attempted. Sorted by their local-window readiness."
                    leads={todaysNew} settings={settings} now={now} accent="primary" />
          <CallList title="Today — Old leads"  subtitle="Already attempted. Auto-scheduled by behavior + timezone."
                    leads={todaysOld} settings={settings} now={now} accent="amber" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Reveal className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">End-of-day summary{isAdmin ? " (team)" : ""}</CardTitle>
              <span className="text-xs text-muted-foreground tabular-nums">{todaysCalls.length} calls today</span>
            </CardHeader>
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SummaryCell label="Answered" value={eod.answered} icon={Check} tone="bg-emerald-500/10 text-emerald-600" />
              <SummaryCell label="Voicemail" value={eod.voicemail} icon={Voicemail} tone="bg-sky-500/10 text-sky-600" />
              <SummaryCell label="No answer" value={eod.noAnswer} icon={PhoneMissed} tone="bg-zinc-500/10 text-zinc-600" />
              <SummaryCell label="Busy" value={eod.busy} icon={PhoneOff} tone="bg-zinc-500/10 text-zinc-600" />
              <SummaryCell label="Callback" value={eod.callback} icon={CalendarClock} tone="bg-amber-500/10 text-amber-600" />
              <SummaryCell label="Send info" value={eod.sendInfo} icon={Send} tone="bg-indigo-500/10 text-indigo-600" />
              <SummaryCell label="Qualified" value={eod.qualified} icon={Star} tone="bg-green-500/15 text-green-700" />
              <SummaryCell label="Not interested" value={eod.notInterested} icon={X} tone="bg-rose-500/10 text-rose-600" />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">This week — calls per day</CardTitle></CardHeader>
            <div className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekChart}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                    contentStyle={{
                      background: "hsl(var(--popover) / 0.85)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 10,
                      boxShadow: "var(--elevation-3)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="calls" radius={[6, 6, 0, 0]}>
                    {weekChart.map((_, i) => <Cell key={i} fill="url(#barFill)" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Reveal>

        <Reveal className="lg:col-span-2" delay={0.05}>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Pipeline snapshot</CardTitle></CardHeader>
            <div className="p-4 pt-0 grid grid-cols-3 md:grid-cols-6 gap-2">
              {["New","Contacted","Qualified","Proposal","Won","Lost"].map((stage) => (
                <Link
                  key={stage}
                  href="/pipeline"
                  className="group rounded-lg bg-muted/40 p-3 hover:bg-muted hover:-translate-y-0.5 transition-all duration-base ease-ios shadow-elevation-1 hover:shadow-elevation-2"
                >
                  <div className="text-xs text-muted-foreground">{stage}</div>
                  <div className="font-display text-2xl font-bold mt-1 tabular-nums">
                    {myLeads.filter((l) => l.pipeline === stage).length}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Active projects</CardTitle></CardHeader>
            <div className="px-2 pb-3">
              {projects.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No projects yet.</p>
              ) : projects.slice(0, 5).map((p) => (
                <Link key={p.id} href="/projects" className="block px-3 py-2 hover:bg-accent rounded-md transition-colors">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.stage}</div>
                </Link>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function CallList({
  title, subtitle, leads, settings, now, accent,
}: {
  title: string;
  subtitle: string;
  leads: any[];
  settings: any;
  now: Date;
  accent: "primary" | "amber";
}) {
  const accentRing = accent === "amber" ? "border-amber-500/40" : "border-primary/40";
  const accentBg = accent === "amber" ? "bg-amber-500/5" : "bg-primary/5";
  return (
    <Reveal>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <Badge variant="outline" className={cn("tabular-nums", accentRing, accentBg)}>{leads.length}</Badge>
        </CardHeader>
        <div className="px-2 pb-2">
          {leads.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">All clear here. 🎯</p>
          ) : (
            <StaggerList className="space-y-0.5">
              {leads.map((l, idx) => {
                const win = callWindowState(l.timezone, settings.call_window_start, settings.call_window_end);
                const winTone = win === "in" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : win === "edge" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400";
                const next = l.next_attempt_at ? new Date(l.next_attempt_at) : (l.next_callback_at ? new Date(l.next_callback_at) : null);
                return (
                  <StaggerItem key={l.id}>
                    <Link href={`/leads/${l.id}`} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-accent rounded-md transition-colors duration-base ease-ios">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground font-mono w-6 tabular-nums">#{idx + 1}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">{l.name}</span>
                            <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[l.temperature])}>{l.temperature}</Badge>
                            <span className={cn("inline-flex rounded px-1.5 py-0 text-[10px] font-medium", winTone)}>
                              {win === "in" ? "in window" : win === "edge" ? "edge" : "out of window"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {l.company} · attempt {l.attempts}/{MAX_ATTEMPTS}
                            {next && <> · next {next.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-muted-foreground tabular-nums">{localTime(l.timezone, now)}</div>
                        <div className="text-[10px] text-muted-foreground/70">{l.city}</div>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </div>
      </Card>
    </Reveal>
  );
}

function SummaryCell({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3 shadow-elevation-1">
      <div className={cn("h-9 w-9 rounded-md flex items-center justify-center", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground truncate">{label}</div>
        <div className="font-display text-lg font-bold tabular-nums leading-none mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function KPI({
  label, value, sub, icon: Icon, accent, suffix = "",
}: {
  label: string;
  value: number;
  sub: string;
  icon: any;
  accent?: string;
  suffix?: string;
}) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    red:     "text-red-600 dark:text-red-400 bg-red-500/10",
    amber:   "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  };
  return (
    <TiltCard>
      <Card className="p-3 transition-all duration-base ease-ios hover:border-primary/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center shadow-inner-hl",
            accent ? accentMap[accent] : "text-primary bg-primary/10"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="font-display text-2xl md:text-[28px] font-bold mt-1 tabular-nums leading-none">
          <CountUp value={value} suffix={suffix} />
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
      </Card>
    </TiltCard>
  );
}
