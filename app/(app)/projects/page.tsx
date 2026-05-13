"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatMoney, relativeTime } from "@/lib/utils";
import { Plus, Calendar, DollarSign } from "lucide-react";
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

export default function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const updateProject = useStore((s) => s.updateProject);
  const addProject = useStore((s) => s.addProject);
  const deleteProject = useStore((s) => s.deleteProject);

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", value: "", due_date: "", stage: "Discovery" as ProjectStage, notes: "" });

  const byStage = React.useMemo(() => {
    const map: Record<ProjectStage, typeof projects> = { Discovery: [], Proposal: [], Contract: [], Kickoff: [], Active: [], Delivered: [], "On Hold": [] };
    for (const p of projects) {
      if (map[p.stage]) map[p.stage].push(p);
    }
    return map;
  }, [projects]);

  const onDrop = (e: React.DragEvent, stage: ProjectStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    updateProject(id, { stage });
    toast.success(`Moved to ${stage}`);
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Qualified leads become projects. Track delivery end-to-end.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New Project</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 min-h-[500px]">
        {STAGES.map((stg) => (
          <div
            key={stg.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, stg.id)}
            className={cn("rounded-lg border bg-gradient-to-b from-current to-transparent flex flex-col", stg.tint)}
          >
            <div className="p-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{stg.label}</span>
                <span className="text-xs font-mono text-muted-foreground">{byStage[stg.id].length}</span>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
              {byStage[stg.id].map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                  className="rounded-md border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    {p.value ? <span className="font-mono inline-flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatMoney(p.value)}</span> : <span>—</span>}
                    {p.due_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{p.due_date}</span>}
                  </div>
                </div>
              ))}
              {byStage[stg.id].length === 0 && <div className="text-xs text-muted-foreground text-center py-6">Drop projects here</div>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Value (USD)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div><Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as ProjectStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
