"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useCurrentUser, useIsAdmin } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { LocalTime } from "@/components/leads/local-time";
import { cn, TEMP_COLORS, formatPhone, relativeTime } from "@/lib/utils";
import { bucketLead, MAX_ATTEMPTS } from "@/lib/lead-scheduler";
import { AlertTriangle, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { StaggerList, StaggerItem } from "@/components/motion/stagger";

type Scope = "mine" | "all";

export default function SandboxPage() {
  const leads = useStore((s) => s.leads);
  const restoreFromSandbox = useStore((s) => s.restoreFromSandbox);
  const markNotInterested = useStore((s) => s.markNotInterested);
  const me = useCurrentUser();
  const isAdmin = useIsAdmin();

  const [scope, setScope] = React.useState<Scope>(isAdmin ? "all" : "mine");
  const [search, setSearch] = React.useState("");

  const sandboxed = React.useMemo(() => {
    let xs = leads.filter((l) => bucketLead(l) === "sandbox");
    if (scope === "mine") xs = xs.filter((l) => l.owner_id === me?.id);
    if (search) {
      const q = search.toLowerCase();
      xs = xs.filter((l) =>
        [l.name, l.company, l.city, l.phone, l.email, l.notes].some((v) => v?.toLowerCase().includes(q))
      );
    }
    return xs.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
  }, [leads, scope, me?.id, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 shadow-inner-hl">
              <AlertTriangle className="h-5 w-5" />
            </span>
            Sandbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leads that hit <b>{MAX_ATTEMPTS}</b> attempts without engaging. Review for revival, retire, or mark not interested.
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1 tabular-nums">{sandboxed.length} in sandbox</Badge>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sandbox…" className="pl-9" />
          </div>
          <Segmented<Scope>
            value={scope}
            onChange={setScope}
            options={isAdmin ? [{ value: "mine", label: "Mine" }, { value: "all", label: "All" }] : [{ value: "mine", label: "Mine" }]}
            id="sandbox-scope"
          />
        </div>
      </Card>

      <Reveal>
        <Card className="overflow-hidden">
          {sandboxed.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">
              Sandbox is empty. Leads land here once they hit {MAX_ATTEMPTS} attempts.
            </p>
          ) : (
            <StaggerList>
              {sandboxed.map((l) => (
                <StaggerItem key={l.id}>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border/60 hover:bg-accent/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/leads/${l.id}`} className="font-medium hover:text-primary">{l.name}</Link>
                        <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[l.temperature])}>{l.temperature}</Badge>
                        <Badge variant="outline" className="text-[10px] tabular-nums">{l.attempts} attempts</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {l.company} · {formatPhone(l.phone)} · last touched {relativeTime(l.last_contact_at ?? l.updated_at)}
                      </div>
                      {l.notes && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-2xl">
                          <span className="font-medium">Behavior:</span> {l.notes.split("\n")[0]}
                        </div>
                      )}
                    </div>
                    <LocalTime timezone={l.timezone} city={l.city} state={l.state} compact />
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => {
                        restoreFromSandbox(l.id);
                        toast.success(`${l.name} revived`, { description: "Attempts reset to 0 — back in rotation." });
                      }}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revive
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => {
                        const reason = window.prompt("Reason for marking Not Interested?");
                        if (!reason) return;
                        markNotInterested(l.id, reason);
                        toast.success(`${l.name} marked Not Interested`);
                      }}>
                        <X className="h-3.5 w-3.5 mr-1" /> Not interested
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
