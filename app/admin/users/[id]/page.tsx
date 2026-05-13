"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { cn, initials, relativeTime, formatPhone } from "@/lib/utils";
import {
  ArrowLeft, Phone, CheckSquare, Bell, MessageCircleQuestion, UserPlus,
  FileText, Mail, Activity, TrendingUp, Star, Flame,
} from "lucide-react";
import { AssignTaskDialog } from "@/components/admin/assign-task-dialog";
import { SendReminderDialog } from "@/components/admin/send-reminder-dialog";
import { RequestUpdateDialog } from "@/components/admin/request-update-dialog";

export default function AgentDrillPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const users = useStore((s) => s.users);
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const tasks = useStore((s) => s.tasks);
  const reminders = useStore((s) => s.reminders);
  const updateRequests = useStore((s) => s.updateRequests);

  const user = users.find((u) => u.id === params.id);

  const [taskOpen, setTaskOpen] = React.useState(false);
  const [remOpen, setRemOpen] = React.useState(false);
  const [reqOpen, setReqOpen] = React.useState(false);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="link" onClick={() => router.push("/admin/users")}>Back</Button>
      </div>
    );
  }

  const myLeads = leads.filter((l) => l.owner_id === user.id);
  const myHistory = history.filter((h) => h.by_user === user.id);
  const myTasks = tasks.filter((t) => t.user_id === user.id);
  const myReminders = reminders.filter((r) => r.user_id === user.id);
  const myRequests = updateRequests.filter((r) => r.agent_id === user.id);

  const sevenDays = new Date(Date.now() - 7 * 86400000);
  const callsWeek = myHistory.filter((h) => h.type === "call" && new Date(h.created_at) >= sevenDays);
  const connectsWeek = callsWeek.filter((h) => h.disposition === "Answered" || h.disposition === "Qualified").length;
  const connectRate = callsWeek.length > 0 ? Math.round((connectsWeek / callsWeek.length) * 100) : 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const callsToday = myHistory.filter((h) => h.type === "call" && new Date(h.created_at) >= today).length;
  const qualified = myLeads.filter((l) => l.status === "Qualified").length;
  const hot = myLeads.filter((l) => l.temperature === "Hot").length;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ background: user.avatar_color }}
          >
            {initials(user.full_name)}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.full_name}</h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-3 w-3" /> {user.email}
              <Badge variant="outline" className="ml-1">{user.role}</Badge>
              {!user.active && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}><CheckSquare className="h-4 w-4 mr-1.5" /> Assign task</Button>
          <Button variant="outline" size="sm" onClick={() => setRemOpen(true)}><Bell className="h-4 w-4 mr-1.5" /> Send reminder</Button>
          <Button variant="outline" size="sm" onClick={() => setReqOpen(true)}><MessageCircleQuestion className="h-4 w-4 mr-1.5" /> Request update</Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/reports?agent=${user.id}`}><FileText className="h-4 w-4 mr-1.5" /> Generate PDF</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <KPI label="Leads" value={myLeads.length} icon={UserPlus} />
        <KPI label="Calls today" value={callsToday} icon={Phone} />
        <KPI label="Calls (7d)" value={callsWeek.length} icon={Activity} />
        <KPI label="Connect rate" value={`${connectRate}%`} icon={TrendingUp} accent="emerald" />
        <KPI label="Qualified" value={qualified} icon={Star} accent="emerald" />
        <KPI label="Hot" value={hot} icon={Flame} accent="red" />
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({myLeads.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({myHistory.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({myTasks.length})</TabsTrigger>
          <TabsTrigger value="reminders">Reminders ({myReminders.length})</TabsTrigger>
          <TabsTrigger value="requests">Update requests ({myRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Temp</th>
                    <th className="text-left p-3 font-medium">Last contact</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeads.slice(0, 50).map((l) => (
                    <tr key={l.id} className="border-b hover:bg-accent">
                      <td className="p-3"><Link href={`/leads/${l.id}`} className="font-medium hover:text-primary">{l.name}</Link></td>
                      <td className="p-3 text-muted-foreground">{l.company ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{formatPhone(l.phone)}</td>
                      <td className="p-3"><Badge variant="outline">{l.status}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className={cn(
                        l.temperature === "Hot" && "text-red-600 border-red-500/30",
                        l.temperature === "Warm" && "text-amber-600 border-amber-500/30",
                        l.temperature === "Cold" && "text-sky-600 border-sky-500/30",
                      )}>{l.temperature}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{l.last_contact_at ? relativeTime(l.last_contact_at) : "—"}</td>
                    </tr>
                  ))}
                  {myLeads.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leads assigned.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {myHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">No activity yet.</div>
              ) : (
                myHistory.slice(0, 100).map((h) => {
                  const lead = leads.find((l) => l.id === h.lead_id);
                  return (
                    <div key={h.id} className="flex items-start gap-2 text-sm rounded-md border p-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{h.disposition || h.type}</span>
                          {lead && <Link href={`/leads/${lead.id}`} className="text-xs text-primary hover:underline">{lead.name}</Link>}
                          <span className="ml-auto text-xs text-muted-foreground">{relativeTime(h.created_at)}</span>
                        </div>
                        {h.note && <div className="text-xs text-muted-foreground mt-0.5">{h.note}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <div className="p-4 space-y-2">
              {myTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">No tasks.</div>
              ) : (
                myTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                    <input type="checkbox" checked={t.done} readOnly className="h-4 w-4" />
                    <div className="flex-1">
                      <div className={cn("font-medium", t.done && "line-through text-muted-foreground")}>{t.title}</div>
                      {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    </div>
                    <Badge variant="outline" className={cn(
                      t.priority === "urgent" && "text-rose-600 border-rose-500/30",
                      t.priority === "high" && "text-amber-600 border-amber-500/30",
                    )}>{t.priority}</Badge>
                    <span className="text-xs text-muted-foreground">{t.due_at ? new Date(t.due_at).toLocaleDateString() : "no due"}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <div className="p-4 space-y-2">
              {myReminders.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">No reminders.</div>
              ) : (
                myReminders.map((r) => (
                  <div key={r.id} className="rounded-md border p-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium flex-1">{r.message}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.fires_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <div className="p-4 space-y-2">
              {myRequests.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">No update requests.</div>
              ) : (
                myRequests.map((ur) => (
                  <div key={ur.id} className="rounded-md border p-2.5 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn(
                        ur.status === "pending" && "text-amber-600 border-amber-500/30",
                        ur.status === "answered" && "text-emerald-600 border-emerald-500/30",
                      )}>{ur.status}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{relativeTime(ur.created_at)}</span>
                    </div>
                    <div className="font-medium">{ur.question}</div>
                    {ur.reply && (
                      <div className="mt-1.5 pl-3 border-l-2 border-emerald-500 text-muted-foreground italic">"{ur.reply}"</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AssignTaskDialog open={taskOpen} onOpenChange={setTaskOpen} preselectedAgentId={user.id} />
      <SendReminderDialog open={remOpen} onOpenChange={setRemOpen} preselectedAgentId={user.id} />
      <RequestUpdateDialog open={reqOpen} onOpenChange={setReqOpen} preselectedAgentId={user.id} />
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: { label: string; value: any; icon: any; accent?: string }) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    red: "text-red-600 bg-red-500/10",
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
    </Card>
  );
}
