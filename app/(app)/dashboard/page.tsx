"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/leads/local-time";
import { scoreLead } from "@/lib/scoring";
import { callWindowState } from "@/lib/timezones";
import { cn, TEMP_COLORS, daysSince } from "@/lib/utils";
import { Phone, Flame, Clock, ArrowRight, TrendingUp, Star, AlertTriangle } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { CountUp } from "@/components/motion/count-up";
import { TiltCard } from "@/components/motion/tilt-card";
import { StaggerList, StaggerItem } from "@/components/motion/stagger";
import { Reveal } from "@/components/motion/reveal";

export default function DashboardPage() {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const callsToday = history.filter((h) => h.type === "call" && new Date(h.created_at) >= todayStart).length;

  const sevenDays = new Date(Date.now() - 7 * 86400000);
  const recentCalls = history.filter((h) => h.type === "call" && new Date(h.created_at) >= sevenDays);
  const connects = recentCalls.filter((h) => h.disposition === "Answered" || h.disposition === "Qualified").length;
  const connectRate = recentCalls.length > 0 ? Math.round((connects / recentCalls.length) * 100) : 0;

  const qualifiedThisWeek = leads.filter((l) => l.status === "Qualified" && daysSince(l.updated_at) <= 7).length;
  const hot = leads.filter((l) => l.temperature === "Hot" && !["Qualified", "Dead", "Not Interested"].includes(l.status)).length;
  const callbacksDue = leads.filter((l) => l.next_callback_at && new Date(l.next_callback_at) <= new Date(now.getTime() + 86400000)).length;

  const inWindow = leads.filter((l) =>
    callWindowState(l.timezone, settings.call_window_start, settings.call_window_end) === "in"
    && !["Dead", "Not Interested", "Qualified"].includes(l.status)
  );
  const queue = inWindow
    .map((l) => ({ l, s: scoreLead(l, settings.scoring, settings.call_window_start, settings.call_window_end) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.l);

  const weekChart = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date(Date.now() - i * 86400000);
      const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = history.filter((h) => h.type === "call" && new Date(h.created_at) >= dayStart && new Date(h.created_at) < dayEnd).length;
      days.push({ day: dayStart.toLocaleDateString("en-US", { weekday: "short" }), calls: count });
    }
    return days;
  }, [history]);

  const greet = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";

  const pipelineSnap = ["New","Contacted","Qualified","Proposal","Won","Lost"].map((stage) => ({
    stage,
    count: leads.filter((l) => l.pipeline === stage).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Good {greet},{" "}
            <span className="bg-gradient-to-r from-primary to-cold bg-clip-text text-transparent">
              let's close some deals.
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button asChild size="lg" className="shadow-elevation-3">
          <Link href="/call-mode"><Phone className="h-4 w-4 mr-1.5" />Open Call Mode</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPI label="In-window now"  value={inWindow.length}       sub="ready to call"     icon={Clock} />
        <KPI label="Calls today"    value={callsToday}            sub="attempts logged"   icon={Phone} />
        <KPI label="Connect rate"   value={connectRate}  suffix="%" sub="last 7 days"     icon={TrendingUp} accent="emerald" />
        <KPI label="Qualified"      value={qualifiedThisWeek}     sub="this week"         icon={Star} accent="emerald" />
        <KPI label="Hot leads"      value={hot}                   sub="need action"       icon={Flame} accent="red" />
        <KPI label="Callbacks due"  value={callbacksDue}          sub="today/overdue"     icon={AlertTriangle} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Reveal className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Priority queue — now</CardTitle>
              <Link href="/call-mode" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                Open Call Mode <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <div className="px-2 pb-2">
              {queue.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No leads currently inside their calling window.</p>
              ) : (
                <StaggerList className="space-y-0.5">
                  {queue.map((l, idx) => (
                    <StaggerItem key={l.id}>
                      <Link href={`/leads/${l.id}`} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-accent rounded-md transition-colors duration-base ease-ios">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground font-mono w-6 tabular-nums">#{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm truncate">{l.name}</span>
                              <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[l.temperature])}>{l.temperature}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{l.company} · {l.attempts}× tried</div>
                          </div>
                        </div>
                        <LocalTime timezone={l.timezone} city={l.city} state={l.state} compact />
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}
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
              {pipelineSnap.map((p) => (
                <Link
                  key={p.stage}
                  href="/pipeline"
                  className="group rounded-lg bg-muted/40 p-3 hover:bg-muted hover:-translate-y-0.5 transition-all duration-base ease-ios shadow-elevation-1 hover:shadow-elevation-2"
                >
                  <div className="text-xs text-muted-foreground">{p.stage}</div>
                  <div className="font-display text-2xl font-bold mt-1 tabular-nums">{p.count}</div>
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
