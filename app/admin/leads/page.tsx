"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn, initials, relativeTime, formatPhone, daysSince } from "@/lib/utils";
import { Search, UserPlus, Users, Flame } from "lucide-react";
import { PushLeadDialog } from "@/components/admin/push-lead-dialog";

export default function AdminAllLeadsPage() {
  const leads = useStore((s) => s.leads);
  const users = useStore((s) => s.users);

  const [query, setQuery] = React.useState("");
  const [ownerFilter, setOwnerFilter] = React.useState<string>("all");
  const [tempFilter, setTempFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [pushOpen, setPushOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((l) => {
      if (q && !`${l.name} ${l.company ?? ""} ${l.email ?? ""}`.toLowerCase().includes(q)) return false;
      if (ownerFilter === "unassigned" && l.owner_id) return false;
      if (ownerFilter !== "all" && ownerFilter !== "unassigned" && l.owner_id !== ownerFilter) return false;
      if (tempFilter !== "all" && l.temperature !== tempFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      return true;
    });
  }, [leads, query, ownerFilter, tempFilter, statusFilter]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((l) => l.id)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><Users className="h-5 w-5 sm:h-6 sm:w-6" /> All leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} total · {filtered.length} shown · {selected.length} selected</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={selected.length === 0} onClick={() => setPushOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Push to agent{selected.length > 1 ? "s" : ""} ({selected.length})
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 border-b">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.filter((u) => u.role === "agent").map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tempFilter} onValueChange={setTempFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All temps</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Warm">Warm</SelectItem>
              <SelectItem value="Cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Attempting">Attempting</SelectItem>
              <SelectItem value="Connected">Connected</SelectItem>
              <SelectItem value="In Discussion">In Discussion</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Not Interested">Not Interested</SelectItem>
              <SelectItem value="Dead">Dead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground bg-muted/30">
                <th className="p-3 w-10">
                  <Checkbox checked={filtered.length > 0 && selected.length === filtered.length} onCheckedChange={toggleAll} />
                </th>
                <th className="text-left p-3 font-medium">Lead</th>
                <th className="text-left p-3 font-medium">Owner</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Temp</th>
                <th className="text-left p-3 font-medium">Attempts</th>
                <th className="text-left p-3 font-medium">Last touch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((l) => {
                const owner = users.find((u) => u.id === l.owner_id);
                const stale = l.last_contact_at && daysSince(l.last_contact_at) > 14;
                return (
                  <tr key={l.id} className="border-b hover:bg-accent">
                    <td className="p-3">
                      <Checkbox checked={selected.includes(l.id)} onCheckedChange={() => toggle(l.id)} />
                    </td>
                    <td className="p-3">
                      <Link href={`/leads/${l.id}`} className="font-medium hover:text-primary flex items-center gap-1">
                        {l.temperature === "Hot" && <Flame className="h-3 w-3 text-red-500" />}
                        {l.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{l.company ?? "—"}</div>
                    </td>
                    <td className="p-3">
                      {owner ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ background: owner.avatar_color }}
                          >
                            {initials(owner.full_name)}
                          </span>
                          <span className="text-xs">{owner.full_name}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-rose-600 border-rose-500/30 text-[10px]">Unassigned</Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{formatPhone(l.phone)}</td>
                    <td className="p-3"><Badge variant="outline">{l.status}</Badge></td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn(
                        l.temperature === "Hot" && "text-red-600 border-red-500/30",
                        l.temperature === "Warm" && "text-amber-600 border-amber-500/30",
                        l.temperature === "Cold" && "text-sky-600 border-sky-500/30",
                      )}>{l.temperature}</Badge>
                    </td>
                    <td className="p-3">{l.attempts}</td>
                    <td className={cn("p-3 text-xs", stale ? "text-rose-600" : "text-muted-foreground")}>
                      {l.last_contact_at ? relativeTime(l.last_contact_at) : "never"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length > 200 && (
                <tr><td colSpan={8} className="p-3 text-center text-xs text-muted-foreground">Showing first 200 of {filtered.length} matches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PushLeadDialog open={pushOpen} onOpenChange={setPushOpen} leadIds={selected} />
    </div>
  );
}
