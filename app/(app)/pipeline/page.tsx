"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, TEMP_COLORS, formatMoney } from "@/lib/utils";
import { Phone, Building } from "lucide-react";
import { toast } from "sonner";
import type { PipelineStage } from "@/types";

const STAGES: { id: PipelineStage; label: string; tint: string }[] = [
  { id: "New",        label: "New",        tint: "from-slate-500/10" },
  { id: "Contacted",  label: "Contacted",  tint: "from-purple-500/10" },
  { id: "Qualified",  label: "Qualified",  tint: "from-amber-500/10" },
  { id: "Proposal",   label: "Proposal",   tint: "from-indigo-500/10" },
  { id: "Won",        label: "Won",        tint: "from-emerald-500/10" },
  { id: "Lost",       label: "Lost",       tint: "from-rose-500/10" },
];

export default function PipelinePage() {
  const leads = useStore((s) => s.leads);
  const updateLead = useStore((s) => s.updateLead);
  const addProject = useStore((s) => s.addProject);

  const byStage = React.useMemo(() => {
    const map: Record<PipelineStage, typeof leads> = { New: [], Contacted: [], Qualified: [], Proposal: [], Won: [], Lost: [] };
    for (const l of leads) {
      const stage = l.pipeline || "New";
      if (map[stage]) map[stage].push(l);
    }
    return map;
  }, [leads]);

  const onDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    updateLead(id, { pipeline: stage });
    if (stage === "Won" && confirm(`Promote ${lead.name} to an active project?`)) {
      addProject({ lead_id: id, name: `${lead.company || lead.name} — ${lead.service_interest || "Project"}`, stage: "Discovery", value: lead.budget ?? null });
      toast.success("Project created — see Projects board");
    } else {
      toast.success(`Moved to ${stage}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Drag leads across stages. Moving to <span className="font-medium">Won</span> creates a project.</p>
      </div>

      {/* Mobile / tablet: horizontal-scroll kanban (Trello-style). Desktop: 6-col grid. */}
      <div className="-mx-3 sm:-mx-4 lg:mx-0 px-3 sm:px-4 lg:px-0 overflow-x-auto lg:overflow-visible">
        <div className="flex lg:grid lg:grid-cols-6 gap-3 lg:min-h-[500px] min-w-max lg:min-w-0 pb-2 lg:pb-0">
          {STAGES.map((stg) => (
            <div
              key={stg.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, stg.id)}
              className={cn(
                "rounded-lg border bg-gradient-to-b from-current to-transparent flex flex-col shrink-0",
                "w-[280px] lg:w-auto",
                stg.tint
              )}
            >
              <div className="p-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{stg.label}</span>
                  <span className="text-xs font-mono text-muted-foreground">{byStage[stg.id].length}</span>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] lg:max-h-[600px]">
                {byStage[stg.id].map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                    className="rounded-md border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <Link href={`/leads/${l.id}`} className="block">
                      <div className="font-medium text-sm">{l.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building className="h-3 w-3 shrink-0" /><span className="truncate">{l.company}</span></div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[l.temperature])}>{l.temperature}</Badge>
                        {l.budget && <span className="text-xs font-mono text-muted-foreground">{formatMoney(l.budget)}</span>}
                      </div>
                    </Link>
                  </div>
                ))}
                {byStage[stg.id].length === 0 && <div className="text-xs text-muted-foreground text-center py-6">Drop leads here</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
