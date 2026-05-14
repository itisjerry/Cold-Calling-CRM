"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useIsAdmin } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, TEMP_COLORS, formatMoney, initials } from "@/lib/utils";
import {
  Building, ChevronDown, ChevronRight, Search, X as XIcon,
  LayoutGrid, List,
} from "lucide-react";
import { toast } from "sonner";
import type { PipelineStage, LeadTemp } from "@/types";

const STAGES: { id: PipelineStage; label: string; tint: string; ring: string }[] = [
  { id: "New",        label: "New",        tint: "from-slate-500/8",   ring: "ring-slate-500/20" },
  { id: "Contacted",  label: "Contacted",  tint: "from-purple-500/10", ring: "ring-purple-500/30" },
  { id: "Qualified",  label: "Qualified",  tint: "from-amber-500/10",  ring: "ring-amber-500/30" },
  { id: "Proposal",   label: "Proposal",   tint: "from-indigo-500/10", ring: "ring-indigo-500/30" },
  { id: "Won",        label: "Won",        tint: "from-emerald-500/10",ring: "ring-emerald-500/30" },
  { id: "Lost",       label: "Lost",       tint: "from-rose-500/10",   ring: "ring-rose-500/30" },
];

const INITIAL_PER_STAGE = 20;
const PAGE_STEP = 30;

export default function PipelinePage() {
  const leads = useStore((s) => s.leads);
  const users = useStore((s) => s.users);
  const updateLead = useStore((s) => s.updateLead);
  const addProject = useStore((s) => s.addProject);
  const isAdmin = useIsAdmin();

  const [view, setView] = React.useState<"board" | "list">("board");
  const [search, setSearch] = React.useState("");
  const [tempF, setTempF] = React.useState<"all" | LeadTemp>("all");
  const [ownerF, setOwnerF] = React.useState<string>("all");
  const [collapsed, setCollapsed] = React.useState<Set<PipelineStage>>(new Set());
  const [pageSizes, setPageSizes] = React.useState<Record<PipelineStage, number>>({
    New: INITIAL_PER_STAGE, Contacted: INITIAL_PER_STAGE, Qualified: INITIAL_PER_STAGE,
    Proposal: INITIAL_PER_STAGE, Won: INITIAL_PER_STAGE, Lost: INITIAL_PER_STAGE,
  });

  // Active leads only — Dead/Not Interested don't live on the pipeline board.
  const matches = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (l.status === "Dead" || l.status === "Not Interested") return false;
      if (tempF !== "all" && l.temperature !== tempF) return false;
      if (ownerF !== "all" && l.owner_id !== ownerF) return false;
      if (q) {
        const hit = [l.name, l.company, l.city, l.phone, l.email, l.notes]
          .some((v) => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [leads, search, tempF, ownerF]);

  // Group filtered leads by pipeline stage, freshest first within stage.
  const byStage = React.useMemo(() => {
    const map: Record<PipelineStage, typeof leads> = {
      New: [], Contacted: [], Qualified: [], Proposal: [], Won: [], Lost: [],
    };
    for (const l of matches) {
      const stage = l.pipeline || "New";
      if (map[stage]) map[stage].push(l);
    }
    for (const k of Object.keys(map) as PipelineStage[]) {
      map[k].sort((a, b) => +new Date(b.updated_at || 0) - +new Date(a.updated_at || 0));
    }
    return map;
  }, [matches]);

  const totalValue = React.useMemo(
    () => matches.reduce((sum, l) => sum + (l.budget || 0), 0),
    [matches],
  );

  const onDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    updateLead(id, { pipeline: stage });
    if (stage === "Won" && confirm(`Promote ${lead.name} to an active project?`)) {
      addProject({
        lead_id: id,
        name: `${lead.company || lead.name} — ${lead.service_interest || "Project"}`,
        stage: "Discovery",
        value: lead.budget ?? null,
      });
      toast.success("Project created — see Projects board");
    } else {
      toast.success(`Moved to ${stage}`);
    }
  };

  const toggleCollapse = (s: PipelineStage) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const showMore = (s: PipelineStage) =>
    setPageSizes((p) => ({ ...p, [s]: p[s] + PAGE_STEP }));

  const agents = users.filter((u) => u.role === "agent");
  const activeFilters =
    (search ? 1 : 0) + (tempF !== "all" ? 1 : 0) + (ownerF !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground tabular-nums">{matches.length}</span> active
            {totalValue > 0 && <> · pipeline worth <span className="font-medium text-foreground">{formatMoney(totalValue)}</span></>}
            {view === "board" && " · drag cards across stages; Won creates a project"}
          </p>
        </div>
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
      </div>

      {/* Filter bar */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, city, phone…"
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
          <Select value={tempF} onValueChange={(v) => setTempF(v as any)}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All temperatures</SelectItem>
              <SelectItem value="Hot">🔥 Hot</SelectItem>
              <SelectItem value="Warm">🌤️ Warm</SelectItem>
              <SelectItem value="Cold">❄️ Cold</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={ownerF} onValueChange={setOwnerF}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setTempF("all"); setOwnerF("all"); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {view === "board" ? (
        <div className="-mx-3 sm:-mx-4 lg:mx-0 px-3 sm:px-4 lg:px-0 overflow-x-auto lg:overflow-visible">
          <div className="flex lg:grid lg:grid-cols-6 gap-3 lg:min-h-[500px] min-w-max lg:min-w-0 pb-2 lg:pb-0">
            {STAGES.map((stg) => {
              const all = byStage[stg.id];
              const cap = pageSizes[stg.id];
              const shown = all.slice(0, cap);
              const isCollapsed = collapsed.has(stg.id);
              const stageValue = all.reduce((s, l) => s + (l.budget || 0), 0);

              return (
                <div
                  key={stg.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, stg.id)}
                  className={cn(
                    "rounded-lg border bg-gradient-to-b to-transparent flex flex-col shrink-0",
                    "w-[280px] lg:w-auto",
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
                      {shown.map((l) => {
                        const owner = users.find((u) => u.id === l.owner_id);
                        return (
                          <div
                            key={l.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                            className="rounded-md border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 transition-all"
                          >
                            <Link href={`/leads/${l.id}`} className="block">
                              <div className="font-medium text-sm truncate">{l.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3 shrink-0" />
                                <span className="truncate">{l.company}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2 gap-1">
                                <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[l.temperature])}>
                                  {l.temperature}
                                </Badge>
                                {l.budget && (
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {formatMoney(l.budget)}
                                  </span>
                                )}
                                {owner && (
                                  <span
                                    className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                    style={{ background: owner.avatar_color }}
                                    title={owner.full_name}
                                  >
                                    {initials(owner.full_name)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                      {all.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-6">
                          {activeFilters > 0 ? "No matches" : "Drop leads here"}
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
        <PipelineListView leads={matches} byStage={byStage} users={users} />
      )}
    </div>
  );
}

function PipelineListView({
  leads,
  byStage,
  users,
}: {
  leads: any[];
  byStage: Record<PipelineStage, any[]>;
  users: any[];
}) {
  const [openStage, setOpenStage] = React.useState<PipelineStage | "all">("all");

  const rows = openStage === "all" ? leads : byStage[openStage];

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
          All <span className="ml-1 font-mono text-[10px] opacity-70">{leads.length}</span>
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
              <th className="p-2.5 text-left font-medium">Lead</th>
              <th className="p-2.5 text-left font-medium hidden md:table-cell">Company</th>
              <th className="p-2.5 text-left font-medium">Stage</th>
              <th className="p-2.5 text-left font-medium hidden sm:table-cell">Temp</th>
              <th className="p-2.5 text-left font-medium hidden lg:table-cell">Owner</th>
              <th className="p-2.5 text-right font-medium hidden md:table-cell">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                  No leads match the current filters.
                </td>
              </tr>
            )}
            {rows.map((l) => {
              const owner = users.find((u) => u.id === l.owner_id);
              return (
                <tr key={l.id} className="border-t hover:bg-accent/40 transition-colors">
                  <td className="p-2.5">
                    <Link href={`/leads/${l.id}`} className="font-medium hover:text-primary">
                      {l.name}
                    </Link>
                  </td>
                  <td className="p-2.5 hidden md:table-cell text-muted-foreground">{l.company}</td>
                  <td className="p-2.5"><Badge variant="outline" className="text-[10px]">{l.pipeline}</Badge></td>
                  <td className="p-2.5 hidden sm:table-cell">
                    <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[l.temperature])}>
                      {l.temperature}
                    </Badge>
                  </td>
                  <td className="p-2.5 hidden lg:table-cell">
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
                    ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                  </td>
                  <td className="p-2.5 hidden md:table-cell text-right font-mono text-xs text-muted-foreground">
                    {l.budget ? formatMoney(l.budget) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
