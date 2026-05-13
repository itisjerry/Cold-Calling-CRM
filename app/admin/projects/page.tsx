"use client";
import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn, initials, formatMoney, relativeTime } from "@/lib/utils";
import { Search, Briefcase } from "lucide-react";
import type { ProjectStage } from "@/types";

const STAGE_COLORS: Record<string, string> = {
  Discovery: "bg-sky-500/15 text-sky-600",
  Proposal: "bg-indigo-500/15 text-indigo-600",
  Contract: "bg-violet-500/15 text-violet-600",
  Kickoff: "bg-amber-500/15 text-amber-600",
  Active: "bg-emerald-500/15 text-emerald-600",
  Delivered: "bg-green-500/15 text-green-600",
  "On Hold": "bg-zinc-500/15 text-zinc-600",
};

export default function AdminAllProjectsPage() {
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const updateProject = useStore((s) => s.updateProject);

  const [query, setQuery] = React.useState("");
  const [ownerFilter, setOwnerFilter] = React.useState<string>("all");
  const [stageFilter, setStageFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (ownerFilter !== "all" && p.owner_id !== ownerFilter) return false;
      if (stageFilter !== "all" && p.stage !== stageFilter) return false;
      return true;
    });
  }, [projects, query, ownerFilter, stageFilter]);

  const totalValue = filtered.reduce((sum, p) => sum + (p.value ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Briefcase className="h-6 w-6" /> All projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} projects · {formatMoney(totalValue)} total value</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 border-b">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="pl-9" />
          </div>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {users.filter((u) => u.role === "agent").map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {Object.keys(STAGE_COLORS).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground bg-muted/30">
                <th className="text-left p-3 font-medium">Project</th>
                <th className="text-left p-3 font-medium">Owner</th>
                <th className="text-left p-3 font-medium">Stage</th>
                <th className="text-left p-3 font-medium">Value</th>
                <th className="text-left p-3 font-medium">Due</th>
                <th className="text-left p-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const owner = users.find((u) => u.id === p.owner_id);
                return (
                  <tr key={p.id} className="border-b hover:bg-accent">
                    <td className="p-3">
                      <Link href="/projects" className="font-medium hover:text-primary">{p.name}</Link>
                    </td>
                    <td className="p-3">
                      {owner ? (
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: owner.avatar_color }}>{initials(owner.full_name)}</span>
                          <span className="text-xs">{owner.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Select value={p.stage} onValueChange={(v) => updateProject(p.id, { stage: v as ProjectStage })}>
                        <SelectTrigger className={cn("h-7 px-2 text-xs w-[130px]", STAGE_COLORS[p.stage])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(STAGE_COLORS).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">{formatMoney(p.value)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{relativeTime(p.updated_at)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No projects match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
