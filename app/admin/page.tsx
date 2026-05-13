"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, useAgents } from "@/lib/store";
import { cn, initials, relativeTime } from "@/lib/utils";
import {
  Users, Phone, TrendingUp, Star, Flame, AlertTriangle,
  UserPlus, CheckSquare, Bell, MessageCircleQuestion, ArrowRight, Activity, Trophy,
} from "lucide-react";
import { PushLeadDialog } from "@/components/admin/push-lead-dialog";
import { AssignTaskDialog } from "@/components/admin/assign-task-dialog";
import { SendReminderDialog } from "@/components/admin/send-reminder-dialog";
import { RequestUpdateDialog } from "@/components/admin/request-update-dialog";

export default function AdminDashboardPage() {
  const agents = useAgents();
  const users = useStore((s) => s.users);
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const tasks = useStore((s) => s.tasks);
  const updateRequests = useStore((s) => s.updateRequests);
  const activity = useStore((s) => s.activity);

  const [pushOpen, setPushOpen] = React.useState(false);
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [remOpen, setRemOpen] = React.useState(false);
  const [reqOpen, setReqOpen] = React.useState(false);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const callsToday = history.filter((h) => h.type === "call" && new Date(h.created_at) >= today).length;

  const sevenDays = new Date(Date.now() - 7 * 86400000);
  const recentCalls = history.filter((h) => h.type === "call" && new Date(h.created_at) >= sevenDays);
  const connects = recentCalls.filter((h) => h.disposition === "Answered" || h.disposition === "Qualified").length;
  const connectRate = recentCalls.length > 0 ? Math.round((connects / recentCalls.length) * 100) : 0;

  const qualified = leads.filter((l) => l.status === "Qualified").length;
  const hot = leads.filter((l) => l.temperature === "Hot" && !["Qualified", "Dead", "Not Interested"].includes(l.status)).length;
  const overdueCallbacks = leads.filter((l) => l.next_callback_at && new Date(l.next_callback_at) < now).length;
  const overdueTasks = tasks.filter((t) => !t.done && t.due_at && new Date(t.due_at) < now).length;
  const pendingUpdates = updateRequests.filter((u) => u.status === "pending").length;
  const unassigned = leads.filter((l) => !l.owner_id && !["Dead", "Not Interested"].includes(l.status)).length;

  const agentStats = agents.map((a) => {
    const myLeads = leads.filter((l) => l.owner_id === a.id);
    const myCallsToday = history.filter((h) => h.by_user === a.id && h.type === "call" && new Date(h.created_at) >= today).length;
    const myCallsWeek = history.filter((h) => h.by_user === a.id && h.type === "call" && new Date(h.created_at) >= sevenDays).length;
    const myConnectsWeek = history.filter((h) => h.by_user === a.id && h.type === "call" && new Date(h.created_at) >= sevenDays && (h.disposition === "Answered" || h.disposition === "Qualified")).length;
    const myQuals = myLeads.filter((l) => l.status === "Qualified").length;
    const myHot = myLeads.filter((l) => l.temperature === "Hot").length;
    const last = history
      .filter((h) => h.by_user === a.id)
      .sort((x, y) => +new Date(y.created_at) - +new Date(x.created_at))[0];
    const connectRateA = myCallsWeek > 0 ? Math.round((myConnectsWeek / myCallsWeek) * 100) : 0;
    return { a, myLeads, myCallsToday, myCallsWeek, myQuals, myHot, last, connectRateA };
  });

  const recentActivity = activity.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin command center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agents.length} agents · {leads.length} leads · {pendingUpdates} pending update{pendingUpdates !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPushOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" /> Push lead</Button>
          <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}><CheckSquare className="h-4 w-4 mr-1.5" /> Assign task</Button>
          <Button variant="outline" size="sm" onClick={() => setRemOpen(true)}><Bell className="h-4 w-4 mr-1.5" /> Send reminder</Button>
          <Button variant="outline" size="sm" onClick={() => setReqOpen(true)}><MessageCircleQuestion className="h-4 w-4 mr-1.5" /> Request update</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPI label="Agents" value={agents.length} icon={Users} />
        <KPI label="Calls today" value={callsToday} icon={Phone} />
        <KPI label="Connect rate" value={`${connectRate}%`} icon={TrendingUp} accent="emerald" sub="last 7d" />
        <KPI label="Qualified" value={qualified} icon={Star} accent="emerald" />
        <KPI label="Hot pipeline" value={hot} icon={Flame} accent="red" />
        <KPI label="Overdue tasks" value={overdueTasks} icon={AlertTriangle} accent="amber" />
        <KPI label="Overdue calls" value={overdueCallbacks} icon={AlertTriangle} accent="amber" />
        <KPI label="Unassigned" value={unassigned} icon={UserPlus} accent="rose" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Team at a glance</CardTitle>
            <Link href="/admin/leaderboard" className="text-xs text-primary hover:underline inline-flex items-center gap-1">Leaderboard <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <div className="p-2">
            <div className="grid sm:grid-cols-2 gap-2">
              {agentStats.map(({ a, myLeads, myCallsToday, myCallsWeek, myQuals, myHot, last, connectRateA }) => (
                <Link
                  key={a.id}
                  href={`/admin/users/${a.id}`}
                  className="rounded-md border p-3 hover:bg-accent transition"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: a.avatar_color }}
                    >
                      {initials(a.full_name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {last ? `Last active ${relativeTime(last.created_at)}` : "No activity yet"}
                      </div>
                    </div>
                    {myHot > 0 && (
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-500/30">
                        <Flame className="h-3 w-3 mr-0.5" /> {myHot}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <Stat label="Leads" value={myLeads.length} />
                    <Stat label="Today" value={myCallsToday} />
                    <Stat label="Connect" value={`${connectRateA}%`} />
                    <Stat label="Qual" value={myQuals} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Live activity</CardTitle>
            <Link href="/admin/activity" className="text-xs text-primary hover:underline">All</Link>
          </CardHeader>
          <div className="px-3 pb-3 space-y-2 max-h-80 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No activity yet.</div>
            ) : (
              recentActivity.map((ev) => {
                const actor = users.find((u) => u.id === ev.actor_id);
                return (
                  <div key={ev.id} className="flex items-start gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{actor?.full_name ?? "System"}</span>{" "}
                      <span className="text-muted-foreground">{humanizeKind(ev.kind)}</span>
                      <div className="text-[10px] text-muted-foreground">{relativeTime(ev.created_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4" /> Pending update requests</CardTitle>
            <Badge variant="outline">{pendingUpdates}</Badge>
          </CardHeader>
          <div className="px-3 pb-3 space-y-2 max-h-80 overflow-y-auto">
            {updateRequests.filter((u) => u.status === "pending").length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No pending requests.</div>
            ) : (
              updateRequests
                .filter((u) => u.status === "pending")
                .map((ur) => {
                  const agent = users.find((u) => u.id === ur.agent_id);
                  const lead = leads.find((l) => l.id === ur.lead_id);
                  return (
                    <div key={ur.id} className="rounded-md border p-2.5 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{agent?.full_name}</span>
                        {lead && <span className="text-muted-foreground">on {lead.name}</span>}
                        <span className="ml-auto text-[10px] text-muted-foreground">{relativeTime(ur.created_at)}</span>
                      </div>
                      <div className="text-muted-foreground">{ur.question}</div>
                    </div>
                  );
                })
            )}
            {updateRequests.filter((u) => u.status === "answered").length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-2">Recently answered</div>
                {updateRequests
                  .filter((u) => u.status === "answered")
                  .slice(0, 4)
                  .map((ur) => {
                    const agent = users.find((u) => u.id === ur.agent_id);
                    return (
                      <div key={ur.id} className="rounded-md border p-2.5 text-xs bg-emerald-50/30 dark:bg-emerald-900/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{agent?.full_name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{relativeTime(ur.answered_at ?? ur.created_at)}</span>
                        </div>
                        <div className="text-foreground/80 italic">"{ur.reply}"</div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Top this week</CardTitle>
            <Link href="/admin/leaderboard" className="text-xs text-primary hover:underline">View</Link>
          </CardHeader>
          <div className="px-3 pb-3 space-y-1.5">
            {agentStats
              .slice()
              .sort((x, y) => y.myCallsWeek - x.myCallsWeek)
              .slice(0, 5)
              .map(({ a, myCallsWeek, connectRateA }, idx) => (
                <div key={a.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent">
                  <div className={cn("text-xs font-mono w-5", idx === 0 ? "text-amber-500" : idx === 1 ? "text-zinc-400" : idx === 2 ? "text-orange-700" : "text-muted-foreground")}>
                    #{idx + 1}
                  </div>
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: a.avatar_color }}
                  >
                    {initials(a.full_name)}
                  </span>
                  <span className="text-sm flex-1 truncate">{a.full_name}</span>
                  <span className="text-xs text-muted-foreground">{myCallsWeek} calls · {connectRateA}%</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <PushLeadDialog open={pushOpen} onOpenChange={setPushOpen} leadIds={[]} />
      <AssignTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <SendReminderDialog open={remOpen} onOpenChange={setRemOpen} />
      <RequestUpdateDialog open={reqOpen} onOpenChange={setReqOpen} />
    </div>
  );
}

function KPI({ label, value, sub, icon: Icon, accent }: { label: string; value: any; sub?: string; icon: any; accent?: string }) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    red:     "text-red-600 bg-red-500/10",
    amber:   "text-amber-600 bg-amber-500/10",
    rose:    "text-rose-600 bg-rose-500/10",
  };
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", accent ? accentMap[accent] : "text-primary bg-primary/10")}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function humanizeKind(kind: string): string {
  return kind.replace(/_/g, " ");
}
