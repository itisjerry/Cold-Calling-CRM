"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatPhone, relativeTime, TEMP_COLORS, STATUS_COLORS, daysSince } from "@/lib/utils";
import { scoreLead } from "@/lib/scoring";
import { LocalTime } from "@/components/leads/local-time";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { QuickLogModal } from "@/components/leads/quick-log-modal";
import {
  Plus, Upload, Download, Search, Filter, MoreHorizontal, Phone, Star, Flame, Snowflake, Thermometer,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export default function LeadsPage() {
  const leads = useStore((s) => s.leads);
  const settings = useStore((s) => s.settings);
  const bulkUpdate = useStore((s) => s.bulkUpdate);
  const bulkDelete = useStore((s) => s.bulkDelete);

  const [search, setSearch] = React.useState("");
  const [statusF, setStatusF] = React.useState("all");
  const [tempF, setTempF] = React.useState("all");
  const [ageF, setAgeF] = React.useState("all");
  const [attF, setAttF] = React.useState("all");
  const [sort, setSort] = React.useState("score");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [quickLead, setQuickLead] = React.useState<any>(null);

  const filtered = React.useMemo(() => {
    let xs = leads;
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
    const scored = xs.map((l) => ({ ...l, _score: scoreLead(l, settings.scoring, settings.call_window_start, settings.call_window_end) }));
    if (sort === "score") scored.sort((a, b) => b._score - a._score);
    if (sort === "created") scored.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === "lastContact") scored.sort((a, b) => +new Date(b.last_contact_at || 0) - +new Date(a.last_contact_at || 0));
    if (sort === "attempts") scored.sort((a, b) => b.attempts - a.attempts);
    if (sort === "name") scored.sort((a, b) => a.name.localeCompare(b.name));
    return scored;
  }, [leads, search, statusF, tempF, ageF, attF, sort, settings]);

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

  const hot = leads.filter((l) => l.temperature === "Hot").length;
  const newCount = leads.filter((l) => daysSince(l.created_at) <= 3).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{leads.length}</span> total ·{" "}
            <span className="text-emerald-600">{newCount}</span> new ·{" "}
            <span className="text-red-500">{hot}</span> hot
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link href="/import"><Upload className="h-4 w-4 mr-1.5" />Import</Link></Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add Lead</Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, city, phone…" className="pl-9" />
          </div>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["New","Attempting","Connected","In Discussion","Follow-up","Qualified","Not Interested","Dead"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tempF} onValueChange={setTempF}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Temps</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Warm">Warm</SelectItem>
              <SelectItem value="Cold">Cold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ageF} onValueChange={setAgeF}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any age</SelectItem>
              <SelectItem value="new">New (≤3d)</SelectItem>
              <SelectItem value="recent">Recent (≤14d)</SelectItem>
              <SelectItem value="old">Old (&gt;30d)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={attF} onValueChange={setAttF}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any attempts</SelectItem>
              <SelectItem value="0">No attempts</SelectItem>
              <SelectItem value="1-3">1–3 attempts</SelectItem>
              <SelectItem value="4+">4+ attempts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Sort: Score</SelectItem>
              <SelectItem value="created">Sort: Date Added</SelectItem>
              <SelectItem value="lastContact">Sort: Last Contact</SelectItem>
              <SelectItem value="attempts">Sort: Attempts</SelectItem>
              <SelectItem value="name">Sort: Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
                <th className="p-3 text-left font-medium">Lead</th>
                <th className="p-3 text-left font-medium hidden md:table-cell">Company</th>
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
                <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">
                  No leads match. Try clearing filters or <Link className="text-primary hover:underline" href="/import">importing a CSV</Link>.
                </td></tr>
              )}
              {filtered.map((l) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border bg-card shadow-lg px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={() => { bulkUpdate([...selected], { temperature: "Hot" }); toast.success(`Marked ${selected.size} as Hot`); setSelected(new Set()); }}>Mark Hot</Button>
          <Button size="sm" variant="ghost" onClick={() => { bulkUpdate([...selected], { temperature: "Warm" }); toast.success(`Marked ${selected.size} as Warm`); setSelected(new Set()); }}>Mark Warm</Button>
          <Button size="sm" variant="ghost" onClick={() => { bulkUpdate([...selected], { temperature: "Cold" }); toast.success(`Marked ${selected.size} as Cold`); setSelected(new Set()); }}>Mark Cold</Button>
          <Button size="sm" variant="ghost" onClick={() => { bulkUpdate([...selected], { status: "Follow-up" }); toast.success(`Moved ${selected.size} to Follow-up`); setSelected(new Set()); }}>Follow-up</Button>
          <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${selected.size} leads?`)) { bulkDelete([...selected]); toast.success("Deleted"); setSelected(new Set()); } }} className="text-destructive hover:text-destructive">Delete</Button>
        </div>
      )}

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} />
      <QuickLogModal open={!!quickLead} onOpenChange={(o) => !o && setQuickLead(null)} lead={quickLead} />
    </div>
  );
}
