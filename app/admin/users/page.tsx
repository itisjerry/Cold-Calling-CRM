"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { cn, initials, relativeTime } from "@/lib/utils";
import { Plus, ArrowRight, UserCog } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const users = useStore((s) => s.users);
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const tasks = useStore((s) => s.tasks);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const deactivateUser = useStore((s) => s.deactivateUser);

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "agent">("agent");

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email required");
      return;
    }
    addUser({ full_name: name, email, role, active: true });
    toast.success(`Added ${name}`);
    setOpen(false);
    setName(""); setEmail(""); setRole("agent");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><UserCog className="h-5 w-5 sm:h-6 sm:w-6" /> Users</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{users.length} users · {users.filter(u => u.active).length} active</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add user</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b text-xs text-muted-foreground">
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Leads</th>
                <th className="text-left p-3 font-medium">Calls (7d)</th>
                <th className="text-left p-3 font-medium">Open tasks</th>
                <th className="text-left p-3 font-medium">Last active</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const myLeads = leads.filter((l) => l.owner_id === u.id);
                const sevenDays = new Date(Date.now() - 7 * 86400000);
                const myCalls = history.filter((h) => h.by_user === u.id && h.type === "call" && new Date(h.created_at) >= sevenDays).length;
                const myOpenTasks = tasks.filter((t) => t.user_id === u.id && !t.done).length;
                const last = history
                  .filter((h) => h.by_user === u.id)
                  .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];

                return (
                  <tr key={u.id} className="border-b hover:bg-accent">
                    <td className="p-3">
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 group">
                        <span
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: u.avatar_color }}
                        >
                          {initials(u.full_name)}
                        </span>
                        <div>
                          <div className="font-medium group-hover:text-primary">{u.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn(u.role === "admin" && "border-primary text-primary")}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3">{myLeads.length}</td>
                    <td className="p-3">{myCalls}</td>
                    <td className="p-3">{myOpenTasks}</td>
                    <td className="p-3 text-xs text-muted-foreground">{last ? relativeTime(last.created_at) : "never"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn(u.active ? "border-emerald-500/30 text-emerald-600" : "border-zinc-300 text-muted-foreground")}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/admin/users/${u.id}`}>Open <ArrowRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                        {u.active ? (
                          <Button size="sm" variant="ghost" onClick={() => { deactivateUser(u.id); toast.success("Deactivated"); }}>Deactivate</Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => { updateUser(u.id, { active: true }); toast.success("Reactivated"); }}>Reactivate</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
