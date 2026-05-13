"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useCurrentUser, useIsAdmin } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/ui/segmented";
import { LocalTime } from "@/components/leads/local-time";
import { cn, TEMP_COLORS, formatPhone, relativeTime } from "@/lib/utils";
import { X, Search, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { StaggerList, StaggerItem } from "@/components/motion/stagger";

type Scope = "mine" | "all";

export default function NotInterestedPage() {
  const leads = useStore((s) => s.leads);
  const updateLead = useStore((s) => s.updateLead);
  const me = useCurrentUser();
  const isAdmin = useIsAdmin();

  const [scope, setScope] = React.useState<Scope>(isAdmin ? "all" : "mine");
  const [search, setSearch] = React.useState("");

  const xs = React.useMemo(() => {
    let pool = leads.filter((l) => l.status === "Not Interested");
    if (scope === "mine") pool = pool.filter((l) => l.owner_id === me?.id);
    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter((l) =>
        [l.name, l.company, l.city, l.phone, l.email, l.not_interested_reason, l.notes].some((v) => v?.toLowerCase().includes(q))
      );
    }
    return pool.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
  }, [leads, scope, me?.id, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 shadow-inner-hl">
              <X className="h-5 w-5" />
            </span>
            Not Interested
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Filed-away leads with their reason. Edit the remark anytime — the lead stays out of active rotation.
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1 tabular-nums">{xs.length}</Badge>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reasons, names…" className="pl-9" />
          </div>
          <Segmented<Scope>
            value={scope}
            onChange={setScope}
            options={isAdmin ? [{ value: "mine", label: "Mine" }, { value: "all", label: "All" }] : [{ value: "mine", label: "Mine" }]}
            id="ni-scope"
          />
        </div>
      </Card>

      {xs.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No leads here. Marking a call as <b>Not Interested</b> will file them with their reason.
        </Card>
      ) : (
        <Reveal>
          <StaggerList className="grid md:grid-cols-2 gap-3">
            {xs.map((l) => (
              <StaggerItem key={l.id}>
                <NotInterestedCard
                  lead={l}
                  onSave={(reason) => {
                    updateLead(l.id, { not_interested_reason: reason });
                    toast.success("Reason updated");
                  }}
                  onRevive={() => {
                    updateLead(l.id, {
                      status: "New",
                      pipeline: "New",
                      attempts: 0,
                      next_attempt_at: null,
                      not_interested_reason: null,
                    });
                    toast.success(`${l.name} revived`);
                  }}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        </Reveal>
      )}
    </div>
  );
}

function NotInterestedCard({
  lead, onSave, onRevive,
}: { lead: any; onSave: (reason: string) => void; onRevive: () => void }) {
  const [reason, setReason] = React.useState(lead.not_interested_reason ?? "");
  const [editing, setEditing] = React.useState(false);
  React.useEffect(() => setReason(lead.not_interested_reason ?? ""), [lead.not_interested_reason]);
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary">{lead.name}</Link>
            <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[lead.temperature])}>{lead.temperature}</Badge>
            <Badge variant="outline" className="text-[10px] tabular-nums">{lead.attempts} attempts</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {lead.company} · {formatPhone(lead.phone)} · marked {relativeTime(lead.updated_at)}
          </div>
        </div>
        <LocalTime timezone={lead.timezone} city={lead.city} state={lead.state} compact />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Reason / behavior</div>
        {editing ? (
          <div className="space-y-2">
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why aren't they interested?" />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setReason(lead.not_interested_reason ?? ""); setEditing(false); }}>Cancel</Button>
              <Button size="sm" onClick={() => { onSave(reason); setEditing(false); }}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="block w-full text-left rounded-md bg-muted/40 hover:bg-muted px-3 py-2 text-sm leading-snug transition-colors">
            {reason || <span className="text-muted-foreground italic">— click to add a reason —</span>}
          </button>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button size="sm" variant="outline" onClick={onRevive}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revive lead
        </Button>
      </div>
    </Card>
  );
}
