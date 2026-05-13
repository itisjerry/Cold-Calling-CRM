"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, useIsAdmin } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import { Bell, Trash2, Plus } from "lucide-react";
import { SendReminderDialog } from "@/components/admin/send-reminder-dialog";
import { toast } from "sonner";

export default function RemindersPage() {
  const currentUserId = useStore((s) => s.currentUserId);
  const reminders = useStore((s) => s.reminders);
  const leads = useStore((s) => s.leads);
  const users = useStore((s) => s.users);
  const updateReminder = useStore((s) => s.updateReminder);
  const deleteReminder = useStore((s) => s.deleteReminder);
  const isAdmin = useIsAdmin();

  const [addOpen, setAddOpen] = React.useState(false);

  const mine = reminders
    .filter((r) => r.user_id === currentUserId)
    .sort((a, b) => +new Date(a.fires_at) - +new Date(b.fires_at));

  const now = new Date();
  const due = mine.filter((r) => !r.done && new Date(r.fires_at) <= now);
  const upcoming = mine.filter((r) => !r.done && new Date(r.fires_at) > now);
  const done = mine.filter((r) => r.done);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-5 w-5 sm:h-6 sm:w-6" /> Reminders</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{due.length} due · {upcoming.length} upcoming · {done.length} done</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Send reminder
          </Button>
        )}
      </div>

      {due.length > 0 && (
        <Card className="border-rose-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-base text-rose-600">Due now</CardTitle></CardHeader>
          <div className="divide-y">
            {due.map((r) => (
              <Row key={r.id} r={r} leads={leads} users={users} onToggle={(done) => updateReminder(r.id, { done })} onDelete={() => { deleteReminder(r.id); toast.success("Removed"); }} />
            ))}
          </div>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming</CardTitle></CardHeader>
          <div className="divide-y">
            {upcoming.map((r) => (
              <Row key={r.id} r={r} leads={leads} users={users} onToggle={(done) => updateReminder(r.id, { done })} onDelete={() => { deleteReminder(r.id); toast.success("Removed"); }} />
            ))}
          </div>
        </Card>
      )}

      {done.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-muted-foreground">Done</CardTitle></CardHeader>
          <div className="divide-y opacity-60">
            {done.slice(0, 20).map((r) => (
              <Row key={r.id} r={r} leads={leads} users={users} onToggle={(done) => updateReminder(r.id, { done })} onDelete={() => deleteReminder(r.id)} />
            ))}
          </div>
        </Card>
      )}

      {mine.length === 0 && (
        <Card>
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No reminders.
          </div>
        </Card>
      )}

      <SendReminderDialog open={addOpen} onOpenChange={setAddOpen} preselectedAgentId={currentUserId} />
    </div>
  );
}

function Row({
  r, leads, users, onToggle, onDelete,
}: {
  r: any; leads: any[]; users: any[];
  onToggle: (done: boolean) => void;
  onDelete: () => void;
}) {
  const lead = leads.find((l: any) => l.id === r.lead_id);
  const createdBy = users.find((u: any) => u.id === r.created_by);
  const fires = new Date(r.fires_at);
  const overdue = !r.done && fires <= new Date();
  return (
    <div className="flex items-center gap-3 p-3">
      <Checkbox checked={r.done} onCheckedChange={(v) => onToggle(!!v)} />
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium", r.done && "line-through text-muted-foreground")}>{r.message}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={cn(overdue && "text-rose-600 font-medium")}>{fires.toLocaleString()}</span>
          {createdBy && <span>· set by {createdBy.full_name}</span>}
          {lead && <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">· {lead.name}</Link>}
        </div>
      </div>
      {overdue && <Badge variant="outline" className="text-rose-600 border-rose-500/30">Overdue</Badge>}
      <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}
