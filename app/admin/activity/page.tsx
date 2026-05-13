"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { initials, relativeTime } from "@/lib/utils";
import { Activity, Search } from "lucide-react";
import { DateRangeChip } from "@/components/views/date-range-chip";
import { resolveDateRange, withinRange } from "@/lib/date-range";
import type { DateRange } from "@/types";

export default function AdminActivityPage() {
  const activity = useStore((s) => s.activity);
  const users = useStore((s) => s.users);

  const [query, setQuery] = React.useState("");
  const [actorFilter, setActorFilter] = React.useState<string>("all");
  const [kindFilter, setKindFilter] = React.useState<string>("all");
  const [range, setRange] = React.useState<DateRange>({ preset: "last_7_days" });

  const resolved = resolveDateRange(range);

  const kinds = React.useMemo(() => Array.from(new Set(activity.map((e) => e.kind))).sort(), [activity]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return activity.filter((e) => {
      if (!withinRange(e.created_at, resolved)) return false;
      if (actorFilter !== "all" && e.actor_id !== actorFilter) return false;
      if (kindFilter !== "all" && e.kind !== kindFilter) return false;
      if (q) {
        const blob = `${e.kind} ${JSON.stringify(e.payload)}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [activity, query, actorFilter, kindFilter, resolved]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><Activity className="h-5 w-5 sm:h-6 sm:w-6" /> Activity feed</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} events · {resolved.label}</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 p-3 border-b">
          <div className="relative flex-1 min-w-[160px] max-w-md">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…" className="pl-9" />
          </div>
          <DateRangeChip value={range} onChange={setRange} />
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {kinds.map((k) => <SelectItem key={k} value={k}>{k.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No events match the filters.</div>
          ) : (
            filtered.slice(0, 200).map((e) => {
              const actor = users.find((u) => u.id === e.actor_id);
              return (
                <div key={e.id} className="flex items-start gap-3 p-3 hover:bg-accent text-sm">
                  {actor ? (
                    <span className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: actor.avatar_color }}>
                      {initials(actor.full_name)}
                    </span>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{actor?.full_name ?? "System"}</span>
                      <span className="text-muted-foreground">{e.kind.replace(/_/g, " ")}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{relativeTime(e.created_at)}</span>
                    </div>
                    {Object.keys(e.payload).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {Object.entries(e.payload)
                          .filter(([k]) => k !== "agent_id")
                          .map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`)
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
