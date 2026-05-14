"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn, formatMoney, relativeTime } from "@/lib/utils";
import {
  Plus, Calendar, DollarSign, Search, ChevronDown, ChevronRight,
  LayoutGrid, List, X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectStage } from "@/types";

const STAGES: { id: ProjectStage; label: string; tint: string }[] = [
  { id: "Discovery", label: "Discovery", tint: "from-blue-500/10" },
  { id: "Proposal",  label: "Proposal",  tint: "from-indigo-500/10" },
  { id: "Contract",  label: "Contract",  tint: "from-violet-500/10" },
  { id: "Kickoff",   label: "Kickoff",   tint: "from-cyan-500/10" },
  { id: "Active",    label: "Active",    tint: "from-emerald-500/10" },
  { id: "Delivered", label: "Delivered", tint: "from-green-500/10" },
  { id: "On Hold",   label: "On Hold",   tint: "from-amber-500/10" },
];

const INITIAL_PER_STAGE = 15;
const PAGE_STEP = 25;

export default function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const leads = useStore((s) => s.leads);
  const updateProject = useStore((s) => s.updateProject);
  const addProject = useStore((s) => s.addProject);

  const [view, setView] = React.useState<"board" | "list">("board");
  const [search, setSearch] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<ProjectStage>>(new Set());
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", value: "", due_date: "", stage: "Discovery" as ProjectStage, notes: "",
  });
  const [pageSizes, setPageSizes] = React.useState<Record<ProjectStage, number>>({
    Discovery: INITIAL_PER_STAGE, Proposal: INITIAL_PER_STAGE, Contract: INITIAL_PER_STAGE,
    Kickoff: INITIAL_PER_STAGE, Active: INITIAL_PER_STAGE, Delivered: INITIAL_PER_STAGE,
    "On Hold": INITIAL_PER_STAGE,
  });

  const matches = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const lead = p.lead_id ? leads.find((l) => l.id === p.lead_id) : null;
      return [p.name, p.notes, lead?.name, lead?.company]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [projects, leads, search]);

  const byStage = React.useMemo(() => {
    const map: Record<ProjectStage, typeof projects> = {
      Discovery: [], Proposal: [], Contract: [], Kickoff: [], Active: [], Delivered: [], "On Hold": [],
    };
    for (const p of matches) {
      if (map[p.stage]) map[p.stage].push(p);
    }
    for (const k of Object.keys(map) as ProjectStage[]) {
      map[k].sort((a, b) => +new Date(b.updated_at || 0) - +new Date(a.updated_at || 0));
    }
    return map;
  }, [matches]);

  const totalValue = React.useMemo(
    () => matches.reduce((sum, p) => sum + (p.value || 0), 0),
    [matches],
  );

  const onDrop = (e: React.DragEvent, stage: ProjectStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    updateProject(id, { stage });
    toast.success(`Moved to ${stage}`);
  };

  const toggleCollapse = (s: ProjectStage) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const showMore = (s: ProjectStage) =>
    setPageSizes((p) => ({ ...p, [s]: p[s] + PAGE_STEP }));

  const create = () => {
    if (!form.name.trim()) return;
    addProject({
      name: form.name,
      stage: form.stage,
      value: form.value ? Number(form.value) : null,
      due_date: form.due_date || null,
      notes: form.notes || null,
    });
    setOpen(false);
    setForm({ name: "", value: "", due_date: "", stage: "Discovery", notes: "" });
    toast.success("Project created");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground tabular-nums">{matches.length}</span> projects
            {totalValue > 0 && <> · <span className="font-medium text-foreground">{formatMoney(totalValue)}</span> in flight</>}
            {view === "board" && " · drag cards across stages"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="inline-flex rounded-md border p-0.5 bg-card">
            <button
              onClick={() => setView("board")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5",
                view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />New Project
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project name, notes, linked lead…"
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Card>

      {view === "board" ? (
        <div className="-mx-3 sm:-mx-4 lg:mx-0 px-3 sm:px-4 lg:px-0 overflow-x-auto lg:overflow-visible">
          <div className="flex lg:grid lg:grid-cols-7 gap-3 lg:min-h-[500px] min-w-max lg:min-w-0 pb-2 lg:pb-0">
            {STAGES.map((stg) => {
              const all = byStage[stg.id];
              const cap = pageSizes[stg.id];
              const shown = all.slice(0, cap);
              const isCollapsed = collapsed.has(stg.id);
              const stageValue = all.reduce((s, p) => s + (p.value || 0), 0);

              return (
                <div
                  key={stg.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, stg.id)}
                  className={cn(
                    "rounded-lg border bg-gradient-to-b to-transparent flex flex-col shrink-0",
                    "w-[260px] lg:w-auto",
                    stg.tint,
                  )}
                >
                  <button
                    onClick={() => toggleCollapse(stg.id)}
                    className="p-3 border-b shrink-0 text-left hover:bg-foreground/5 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      {isCollapsed
                        ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-sm font-semibold flex-1">{stg.label}</span>
                      <span className="text-xs font-mono text-muted-foreground tabular-nums">
                        {all.length}
                      </span>
                    </div>
                    {stageValue > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono pl-5">
                        {formatMoney(stageValue)}
                      </div>
                    )}
                  </button>
                  {!isCollapsed && (
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] lg:max-h-[640px]">
                      {shown.map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                          className="rounded-md border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 transition-all"
                        >
                          <div className="font-medium text-sm break-words">{p.name}</div>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            {p.value ? (
                              <span className="font-mono inline-flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />{formatMoney(p.value)}
                              </span>
                            ) : <span>—</span>}
                            {p.due_date && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />{p.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {all.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-6">
                          {search ? "No matches" : "Drop projects here"}
                        </div>
                      )}
                      {cap < all.length && (
                        <button
                          onClick={() => showMore(stg.id)}
                          className="w-full text-xs text-primary hover:bg-primary/10 rounded-md py-2 transition-colors font-medium"
                        >
                          Show {Math.min(PAGE_STEP, all.length - cap)} more
                          <span className="ml-1 text-muted-foreground">
                            ({all.length - cap} remaining)
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ProjectsListView projects={matches} byStage={byStage} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Value (USD)</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as ProjectStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectsListView({
  projects,
  byStage,
}: {
  projects: any[];
  byStage: Record<ProjectStage, any[]>;
}) {
  const [openStage, setOpenStage] = React.useState<ProjectStage | "all">("all");
  const rows = openStage === "all" ? projects : byStage[openStage];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap gap-1 p-3 border-b bg-muted/20">
        <button
          onClick={() => setOpenStage("all")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            openStage === "all" ? "bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          All <span className="ml-1 font-mono text-[10px] opacity-70">{projects.length}</span>
        </button>
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenStage(s.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              openStage === s.id ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {s.label} <span className="ml-1 font-mono text-[10px] opacity-70">{byStage[s.id].length}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-2.5 text-left font-medium">Project</th>
              <th className="p-2.5 text-left font-medium hidden md:table-cell">Stage</th>
              <th className="p-2.5 text-right font-medium hidden sm:table-cell">Value</th>
              <th className="p-2.5 text-left font-medium hidden md:table-cell">Due</th>
              <th className="p-2.5 text-left font-medium hidden lg:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  No projects match.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t hover:bg-accent/40 transition-colors">
                <td className="p-2.5 font-medium">{p.name}</td>
                <td className="p-2.5 hidden md:table-cell">
                  <Badge variant="outline" className="text-[10px]">{p.stage}</Badge>
                </td>
                <td className="p-2.5 hidden sm:table-cell text-right font-mono text-xs text-muted-foreground">
                  {p.value ? formatMoney(p.value) : "—"}
                </td>
                <td className="p-2.5 hidden md:table-cell text-xs text-muted-foreground">
                  {p.due_date || "—"}
                </td>
                <td className="p-2.5 hidden lg:table-cell text-xs text-muted-foreground">
                  {relativeTime(p.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
