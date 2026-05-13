"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useIsAdmin, useCurrentUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatPhone, relativeTime, TEMP_COLORS, STATUS_COLORS, daysSince, initials, getLastDisposition } from "@/lib/utils";
import { scoreLead } from "@/lib/scoring";
import { LocalTime } from "@/components/leads/local-time";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { QuickLogModal } from "@/components/leads/quick-log-modal";
import { DateRangeChip } from "@/components/views/date-range-chip";
import { PushLeadDialog } from "@/components/admin/push-lead-dialog";
import { resolveDateRange, withinRange } from "@/lib/date-range";
import {
  Plus, Upload, Download, Search, Phone, Flame, Snowflake, Thermometer, UserPlus,
  SlidersHorizontal, X as XIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "sonner";
import Papa from "papaparse";
import type { DateRange } from "@/types";

type Scope = "mine" | "unassigned" | "all" | string;

export default function LeadsPage() {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const users = useStore((s) => s.users);
  const settings = useStore((s) => s.settings);
  const bulkUpdate = useStore((s) => s.bulkUpdate);
  const bulkDelete = useStore((s) => s.bulkDelete);
  const isAdmin = useIsAdmin();
  const me = useCurrentUser();

  const [search, setSearch] = React.useState("");
  const [statusF, setStatusF] = React.useState("all");
  const [tempF, setTempF] = React.useState("all");
  const [ageF, setAgeF] = React.useState("all");
  const [attF, setAttF] = React.useState("all");
  const [dispF, setDispF] = React.useState("all");
  const [sort, setSort] = React.useState("score");
  const [scope, setScope] = React.useState<Scope>(isAdmin ? "all" : "mine");
  const [range, setRange] = React.useState<DateRange>({ preset: "all_time" });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [pushOpen, setPushOpen] = React.useState(false);
  const [quickLead, setQuickLead] = React.useState<any>(null);

  const resolved = resolveDateRange(range);

  const filtered = React.useMemo(() => {
    let xs = leads;
    // scope by owner
    if (scope === "mine") xs = xs.filter((l) => l.owner_id === me?.id);
    else if (scope === "unassigned") xs = xs.filter((l) => !l.owner_id);
    else if (scope !== "all") xs = xs.filter((l) => l.owner_id === scope);

    if (range.preset !== "all_time") {
      xs = xs.filter((l) => withinRange(l.created_at, resolved));
    }
    if (search) {
      const q = search.toLowerCase();
      xs = xs.filter((l) =>
        [l.name, l.company, l.city, l.phone, l.email, l.notes].some((v) => v?.toLowerCase().includes(q))
      );
    }
    if (statusF !== "all") xs = xs.filter((l) => l.status === statusF);
    if (tempF !== "all") xs = xs.filter((l) => l.temperature === tempF);
    if (ageF !== "all") {
      xs = xs.filter((l) => {
        const d = daysSince(l.created_at);
        if (ageF === "new") return d <= 3;
        if (ageF === "recent") return d <= 14;
        if (ageF === "old") return d > 30;
        return true;
      });
    }
    if (attF !== "all") {
      xs = xs.filter((l) => {
        if (attF === "0") return l.attempts === 0;
        if (attF === "1-3") return l.attempts >= 1 && l.attempts <= 3;
        if (attF === "4+") return l.attempts >= 4;
        return true;
      });
    }
    if (dispF !== "all") {
      xs = xs.filter((l) => getLastDisposition(l.id, history) === dispF);
    }
    const scored = xs.map((l) => ({ ...l, _score: scoreLead(l, settings.scoring, settings.call_window_start, settings.call_window_end) }));
    if (sort === "score") scored.sort((a, b) => b._score - a._score);
    if (sort === "created") scored.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === "lastContact") scored.sort((a, b) => +new Date(b.last_contact_at || 0) - +new Date(a.last_contact_at || 0));
    if (sort === "attempts") scored.sort((a, b) => b.attempts - a.attempts);
    if (sort === "name") scored.sort((a, b) => a.name.localeCompare(b.name));
    return scored;
  }, [leads, history, scope, range, resolved, search, statusF, tempF, ageF, attF, dispF, sort, settings, me]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filtered.map(({ _score, ...l }) => l));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `helio-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const hot = filtered.filter((l) => l.temperature === "Hot").length;
  const newCount = filtered.filter((l) => daysSince(l.created_at) <= 3).length;

  const agentsList = users.filter((u) => u.role === "agent");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {scope === "mine" ? "My leads" : scope === "unassigned" ? "Unassigned leads" : scope === "all" ? "Leads" : `${users.find((u) => u.id === scope)?.full_name ?? "User"}'s leads`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{filtered.length}</span> shown ·{" "}
            <span className="text-emerald-600">{newCount}</span> new ·{" "}
            <span className="text-red-500">{hot}</span> hot · {resolved.label}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild><Link href="/import"><Upload className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Import</span></Link></Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Export</span></Button>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add Lead</Button>
        </div>
      </div>

      {(() => {
        const advancedActive =
          (statusF !== "all" ? 1 : 0) +
          (tempF !== "all" ? 1 : 0) +
          (ageF !== "all" ? 1 : 0) +
          (attF !== "all" ? 1 : 0) +
          (dispF !== "all" ? 1 : 0);

        const scopeOptions: { value: Scope; label: string }[] = [
          { value: "mine", label: "Mine" },
          ...(isAdmin ? [{ value: "all" as Scope, label: "All" }] : []),
          { value: "unassigned", label: "Unassigned" },
        ];

        return (
          <Card className="p-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, city, phone…" className="pl-9" />
              </div>

              <Segmented<Scope> value={scope} onChange={(v) => setScope(v)} options={scopeOptions} id="leads-scope" />

              <DateRangeChip value={range} onChange={setRange} />

              {isAdmin && (
                <Select
                  value={["mine","all","unassigned"].includes(scope) ? "_picker" : scope}
                  onValueChange={(v) => { if (v !== "_picker") setScope(v as Scope); }}
                >
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Specific agent…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_picker" disabled>Specific agent…</SelectItem>
                    {agentsList.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {advancedActive > 0 && (
                      <Badge className="ml-1 h-5 min-w-[20px] justify-center px-1.5 text-[10px] tabular-nums">{advancedActive}</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[280px] space-y-3 p-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status</div>
                    <Select value={statusF} onValueChange={setStatusF}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {["New","Attempting","Connected","In Discussion","Follow-up","Qualified","Not Interested","Dead"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Temperature</div>
                    <Select value={tempF} onValueChange={setTempF}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Temps</SelectItem>
                        <SelectItem value="Hot">Hot</SelectItem>
                        <SelectItem value="Warm">Warm</SelectItem>
                        <SelectItem value="Cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Age</div>
                    <Select value={ageF} onValueChange={setAgeF}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any age</SelectItem>
                        <SelectItem value="new">New (≤3d)</SelectItem>
                        <SelectItem value="recent">Recent (≤14d)</SelectItem>
                        <SelectItem value="old">Old (&gt;30d)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Attempts</div>
                    <Select value={attF} onValueChange={setAttF}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any attempts</SelectItem>
                        <SelectItem value="0">No attempts</SelectItem>
                        <SelectItem value="1-3">1–3 attempts</SelectItem>
                        <SelectItem value="4+">4+ attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Last call</div>
                    <Select value={dispF} onValueChange={setDispF}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any last call</SelectItem>
                        <SelectItem value="Voicemail">Voicemail</SelectItem>
                        <SelectItem value="No Answer">Unanswered</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                        <SelectItem value="Answered">Answered</SelectItem>
                        <SelectItem value="Callback Requested">Callback Requested</SelectItem>
                        <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {advancedActive > 0 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setStatusF("all"); setTempF("all"); setAgeF("all"); setAttF("all"); setDispF("all"); }}>
                      Clear filters
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Sort: Score</SelectItem>
                  <SelectItem value="created">Sort: Date Added</SelectItem>
                  <SelectItem value="lastContact">Sort: Last Contact</SelectItem>
                  <SelectItem value="attempts">Sort: Attempts</SelectItem>
                  <SelectItem value="name">Sort: Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active filter chips */}
            {advancedActive > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/60">
                {statusF !== "all" && <FilterChip label={`Status: ${statusF}`} onClear={() => setStatusF("all")} />}
                {tempF !== "all"   && <FilterChip label={`Temp: ${tempF}`}     onClear={() => setTempF("all")} />}
                {ageF !== "all"    && <FilterChip label={`Age: ${ageF === "new" ? "≤3d" : ageF === "recent" ? "≤14d" : ">30d"}`} onClear={() => setAgeF("all")} />}
                {attF !== "all"    && <FilterChip label={`Attempts: ${attF}`}  onClear={() => setAttF("all")} />}
                {dispF !== "all"   && <FilterChip label={`Last: ${dispF}`}     onClear={() => setDispF("all")} />}
              </div>
            )}
          </Card>
        );
      })()}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
                <th className="p-3 text-left font-medium">Lead</th>
                <th className="p-3 text-left font-medium hidden md:table-cell">Company</th>
                {isAdmin && <th className="p-3 text-left font-medium hidden md:table-cell">Owner</th>}
                <th className="p-3 text-left font-medium hidden lg:table-cell">Location · Local Time</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium hidden sm:table-cell">Temp</th>
                <th className="p-3 text-left font-medium hidden lg:table-cell">Score</th>
                <th className="p-3 text-left font-medium hidden lg:table-cell">Attempts</th>
                <th className="p-3 text-left font-medium hidden xl:table-cell">Added</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="p-10 text-center text-muted-foreground">
                  No leads match. Try clearing filters or <Link className="text-primary hover:underline" href="/import">importing a CSV</Link>.
                </td></tr>
              )}
              {filtered.map((l) => {
                const owner = users.find((u) => u.id === l.owner_id);
                return (
                  <tr key={l.id} className="border-t hover:bg-accent/40 group transition-colors">
                    <td className="p-3"><Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} /></td>
                    <td className="p-3">
                      <Link href={`/leads/${l.id}`} className="font-medium hover:text-primary">{l.name}</Link>
                      <div className="text-xs text-muted-foreground">{formatPhone(l.phone)}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div>{l.company}</div>
                      <div className="text-xs text-muted-foreground">{l.title}</div>
                    </td>
                    {isAdmin && (
                      <td className="p-3 hidden md:table-cell">
                        {owner ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: owner.avatar_color }}>{initials(owner.full_name)}</span>
                            <span className="text-xs">{owner.full_name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-rose-600 border-rose-500/30 text-[10px]">Unassigned</Badge>
                        )}
                      </td>
                    )}
                    <td className="p-3 hidden lg:table-cell"><LocalTime timezone={l.timezone} city={l.city} state={l.state} /></td>
                    <td className="p-3"><span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_COLORS[l.status])}>{l.status}</span></td>
                    <td className="p-3 hidden sm:table-cell"><span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", TEMP_COLORS[l.temperature])}>
                      {l.temperature === "Hot" ? <Flame className="h-3 w-3" /> : l.temperature === "Warm" ? <Thermometer className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
                      {l.temperature}
                    </span></td>
                    <td className="p-3 hidden lg:table-cell font-mono text-xs">{l._score}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className={cn("inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md text-xs font-mono",
                        l.attempts === 0 ? "bg-muted" : l.attempts >= 4 ? "bg-orange-500/15 text-orange-600" : "bg-primary/10 text-primary")}>
                        {l.attempts}
                      </span>
                    </td>
                    <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground">{relativeTime(l.created_at)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => setQuickLead(l)} title="Log attempt"><Phone className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selected.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 inset-x-3 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 z-40 max-w-full rounded-2xl lg:rounded-full border bg-card shadow-lg px-3 lg:px-4 py-2 overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-sm font-medium shrink-0">{selected.size} selected</span>
            <div className="h-4 w-px bg-border shrink-0" />
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => { bulkUpdate([...selected], { temperature: "Hot" }); toast.success(`Marked ${selected.size} as Hot`); setSelected(new Set()); }}>Mark Hot</Button>
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => { bulkUpdate([...selected], { temperature: "Warm" }); toast.success(`Marked ${selected.size} as Warm`); setSelected(new Set()); }}>Mark Warm</Button>
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => { bulkUpdate([...selected], { temperature: "Cold" }); toast.success(`Marked ${selected.size} as Cold`); setSelected(new Set()); }}>Mark Cold</Button>
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => { bulkUpdate([...selected], { status: "Follow-up" }); toast.success(`Moved ${selected.size} to Follow-up`); setSelected(new Set()); }}>Follow-up</Button>
            {isAdmin && (
              <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setPushOpen(true)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Push to agent
              </Button>
            )}
            <Button size="sm" variant="ghost" className="shrink-0 text-destructive hover:text-destructive" onClick={() => { if (confirm(`Delete ${selected.size} leads?`)) { bulkDelete([...selected]); toast.success("Deleted"); setSelected(new Set()); } }}>Delete</Button>
          </div>
        </div>
      )}

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} />
      <QuickLogModal open={!!quickLead} onOpenChange={(o) => !o && setQuickLead(null)} lead={quickLead} />
      <PushLeadDialog open={pushOpen} onOpenChange={setPushOpen} leadIds={[...selected]} />
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="group inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium hover:bg-primary/15 transition-colors duration-base"
    >
      {label}
      <XIcon className="h-3 w-3 opacity-60 group-hover:opacity-100" />
    </button>
  );
}
