"use client";
import * as React from "react";
import { useStore, useIsAdmin } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn, relativeTime, initials } from "@/lib/utils";
import { Plus, Trash2, Calendar, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/types";
import { AssignTaskDialog } from "@/components/admin/assign-task-dialog";

const PRIO_COLOR: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-600 dark:text-red-400",
  high:   "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low:    "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

function TaskRow({ task, users, assignedBy, onToggle, onDelete }: {
  task: Task;
  users: any[];
  assignedBy: any;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const due = task.due_at ? new Date(task.due_at) : null;
  const overdue = !task.done && due && due < new Date();
  const owner = users.find((u) => u.id === task.user_id);
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/40 transition-colors rounded-md">
      <Checkbox checked={task.done} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm", task.done && "line-through text-muted-foreground")}>{task.title}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge className={cn("text-[10px] px-1.5 py-0", PRIO_COLOR[task.priority])}>{task.priority}</Badge>
          {due && (
            <span className={cn("text-xs flex items-center gap-1", overdue ? "text-red-600" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" /> {relativeTime(task.due_at!)}
            </span>
          )}
          {owner && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="h-3 w-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: owner.avatar_color }}>{initials(owner.full_name)}</span>
              {owner.full_name}
            </span>
          )}
          {assignedBy && task.assigned_by && task.assigned_by !== task.user_id && (
            <span className="text-[10px] text-muted-foreground">· by {assignedBy.full_name}</span>
          )}
        </div>
      </div>
      <button className="text-muted-foreground hover:text-destructive p-1" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const isAdmin = useIsAdmin();
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [open, setOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [scope, setScope] = React.useState<"mine" | "all" | string>(isAdmin ? "all" : "mine");
  const [form, setForm] = React.useState({ title: "", due_at: "", priority: "medium" as Task["priority"] });

  const scoped = React.useMemo(() => {
    if (scope === "mine") return tasks.filter((t) => t.user_id === currentUserId);
    if (scope === "all") return tasks;
    return tasks.filter((t) => t.user_id === scope);
  }, [tasks, scope, currentUserId]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const overdue = scoped.filter((t) => !t.done && t.due_at && new Date(t.due_at) < startOfDay);
  const today = scoped.filter((t) => !t.done && t.due_at && new Date(t.due_at) >= startOfDay && new Date(t.due_at) < endOfDay);
  const upcoming = scoped.filter((t) => !t.done && t.due_at && new Date(t.due_at) >= endOfDay);
  const noDate = scoped.filter((t) => !t.done && !t.due_at);
  const done = scoped.filter((t) => t.done);

  const create = () => {
    if (!form.title.trim()) return;
    addTask({ title: form.title, due_at: form.due_at || null, priority: form.priority, user_id: currentUserId });
    setForm({ title: "", due_at: "", priority: "medium" });
    setOpen(false);
    toast.success("Task added");
  };

  const agentUsers = users.filter((u) => u.role === "agent");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Everything you owe yourself or a lead.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={scope} onValueChange={(v) => setScope(v)}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My tasks</SelectItem>
              {isAdmin && <SelectItem value="all">All tasks</SelectItem>}
              {isAdmin && agentUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}'s tasks</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Assign to agent
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New Task</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">Overdue<span className="text-xs font-mono text-red-600">{overdue.length}</span></CardTitle></CardHeader>
          <div className="p-2 pt-0 max-h-[500px] overflow-y-auto">
            {overdue.map((t) => <TaskRow key={t.id} task={t} users={users} assignedBy={users.find((u) => u.id === t.assigned_by)} onToggle={() => updateTask(t.id, { done: !t.done })} onDelete={() => deleteTask(t.id)} />)}
            {overdue.length === 0 && <p className="p-4 text-xs text-muted-foreground text-center">Nothing overdue.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">Today<span className="text-xs font-mono">{today.length}</span></CardTitle></CardHeader>
          <div className="p-2 pt-0 max-h-[500px] overflow-y-auto">
            {today.map((t) => <TaskRow key={t.id} task={t} users={users} assignedBy={users.find((u) => u.id === t.assigned_by)} onToggle={() => updateTask(t.id, { done: !t.done })} onDelete={() => deleteTask(t.id)} />)}
            {today.length === 0 && <p className="p-4 text-xs text-muted-foreground text-center">Nothing due today</p>}
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">Upcoming<span className="text-xs font-mono">{upcoming.length + noDate.length}</span></CardTitle></CardHeader>
          <div className="p-2 pt-0 max-h-[500px] overflow-y-auto">
            {[...upcoming, ...noDate].map((t) => <TaskRow key={t.id} task={t} users={users} assignedBy={users.find((u) => u.id === t.assigned_by)} onToggle={() => updateTask(t.id, { done: !t.done })} onDelete={() => deleteTask(t.id)} />)}
          </div>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">Done<span className="text-xs font-mono text-emerald-600">{done.length}</span></CardTitle></CardHeader>
          <div className="p-2 pt-0 max-h-[500px] overflow-y-auto">
            {done.slice(0, 30).map((t) => <TaskRow key={t.id} task={t} users={users} assignedBy={users.find((u) => u.id === t.assigned_by)} onToggle={() => updateTask(t.id, { done: !t.done })} onDelete={() => deleteTask(t.id)} />)}
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Send proposal to Marcus Chen" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Due</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignTaskDialog open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  );
}
