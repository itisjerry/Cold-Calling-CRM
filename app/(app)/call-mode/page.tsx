"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useIsAdmin, useCurrentUser } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LocalTime } from "@/components/leads/local-time";
import { QuickLogModal } from "@/components/leads/quick-log-modal";
import { scoreLead } from "@/lib/scoring";
import { cn, formatPhone, formatMoney, relativeTime, TEMP_COLORS, STATUS_COLORS } from "@/lib/utils";
import { callWindowState } from "@/lib/timezones";
import type { Lead } from "@/types";
import {
  Phone, Mail, MapPin, Building, Briefcase, MessageSquare, Star, History, FileText, Sparkles, Flame, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const SCRIPTS = [
  { title: "Cold Opener (web dev)", body: "Hi {name}, this is Yahya with Helio. Quick reason for the call — we help {industry} businesses turn their website into a real sales engine. Got 30 seconds for me to share why I'm calling?" },
  { title: "Voicemail (1st attempt)", body: "Hi {name}, this is Yahya from Helio. Reaching out about a website project for {company}. I'll try you again — you can also reach me at [your number]. Thanks!" },
  { title: "Voicemail (3rd+ attempt)", body: "Hi {name}, Yahya here — third try. If now's not a good time, just text 'stop' and I'll close the loop. Otherwise call me back at [your number]." },
  { title: "Objection: too expensive", body: "Totally fair. Most of our clients felt the same — until we showed them what 1 extra conversion per month means at their margin. Mind if I run those numbers for {company}?" },
  { title: "Objection: not now", body: "Got it. Would it be worth a 15-min call next month so I'm not chasing you with no context? I'll put it on the calendar and you can cancel if priorities shift." },
];

function fill(tpl: string, lead: Lead) {
  return tpl
    .replace(/{name}/g, lead.name?.split(" ")[0] || "there")
    .replace(/{company}/g, lead.company || "your business")
    .replace(/{industry}/g, lead.industry?.toLowerCase() || "service");
}

export default function CallModePage() {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const settings = useStore((s) => s.settings);
  const addHistory = useStore((s) => s.addHistory);
  const updateLead = useStore((s) => s.updateLead);
  const isAdmin = useIsAdmin();
  const me = useCurrentUser();

  const [filter, setFilter] = React.useState<"all" | "hot" | "callback" | "new">("all");
  const [scope, setScope] = React.useState<"mine" | "all">(isAdmin ? "all" : "mine");
  const [mobilePane, setMobilePane] = React.useState<"queue" | "lead" | "extras">("lead");
  const [currentId, setCurrentId] = React.useState<string | null>(null);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const queue = React.useMemo(() => {
    let xs = leads.filter((l) => !["Dead", "Not Interested"].includes(l.status));
    if (scope === "mine" && me) xs = xs.filter((l) => l.owner_id === me.id);
    if (filter === "hot") xs = xs.filter((l) => l.temperature === "Hot");
    if (filter === "callback") xs = xs.filter((l) => !!l.next_callback_at);
    if (filter === "new") xs = xs.filter((l) => l.attempts === 0);
    const scored = xs.map((l) => ({ l, s: scoreLead(l, settings.scoring, settings.call_window_start, settings.call_window_end) }));
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.l);
  }, [leads, filter, settings, scope, me]);

  const current = currentId ? leads.find((l) => l.id === currentId) ?? null : null;
  const currentHistory = current ? history.filter((h) => h.lead_id === current.id).slice(0, 20) : [];

  React.useEffect(() => {
    if (!currentId && queue.length > 0) setCurrentId(queue[0].id);
  }, [queue, currentId]);

  const saveNote = () => {
    if (!current || !note.trim()) return;
    addHistory({ lead_id: current.id, type: "note", note });
    updateLead(current.id, { notes: note });
    setNote("");
    toast.success("Note saved");
  };

  const goNext = () => {
    const idx = queue.findIndex((l) => l.id === currentId);
    if (idx >= 0 && idx + 1 < queue.length) setCurrentId(queue[idx + 1].id);
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="h-12 w-12 text-primary mb-4" />
        <h2 className="text-xl font-semibold">No leads yet</h2>
        <p className="text-muted-foreground mt-2">Load demo data or import a CSV to start calling.</p>
        <div className="flex gap-2 mt-4">
          <Button asChild><Link href="/import">Import CSV</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile pane switcher */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="inline-flex rounded-md border p-0.5 bg-card">
          {(["queue", "lead", "extras"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setMobilePane(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors",
                mobilePane === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        {isAdmin && (
          <select
            className="ml-auto rounded-md border bg-background px-2 py-1 text-xs"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="mine">My queue</option>
            <option value="all">All leads</option>
          </select>
        )}
      </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-9rem)]">
      {/* Queue */}
      <Card className={cn(
        "lg:col-span-3 lg:flex lg:flex-col overflow-hidden",
        mobilePane === "queue" ? "flex flex-col h-[70vh]" : "hidden lg:flex"
      )}>
        <CardHeader className="pb-3 border-b shrink-0">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Today's Queue</span>
            <span className="text-xs text-muted-foreground font-mono">{queue.length}</span>
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-2">
            {(["all", "hot", "callback", "new"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("px-2 py-0.5 rounded-md text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}
              >{f}</button>
            ))}
          </div>
        </CardHeader>
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No leads match filter.</div>}
          {queue.map((l, idx) => {
            const win = callWindowState(l.timezone, settings.call_window_start, settings.call_window_end);
            const isActive = l.id === currentId;
            return (
              <button
                key={l.id}
                onClick={() => setCurrentId(l.id)}
                className={cn(
                  "w-full text-left border-b px-3 py-2.5 hover:bg-accent/40 transition-colors",
                  isActive && "bg-primary/8 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      <span className="font-medium text-sm truncate">{l.name}</span>
                      {l.temperature === "Hot" && <Flame className="h-3 w-3 text-red-500 shrink-0" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{l.company}</div>
                  </div>
                  <LocalTime timezone={l.timezone} city={l.city} state={l.state} compact />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("text-[10px] rounded px-1.5 py-0.5", STATUS_COLORS[l.status])}>{l.status}</span>
                  <span className="text-[10px] text-muted-foreground">{l.attempts}× tried</span>
                  {win === "out" && <span className="text-[10px] text-red-500 ml-auto">Off-hours</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Current Lead */}
      <Card className={cn(
        "lg:col-span-5 lg:flex lg:flex-col overflow-hidden",
        mobilePane === "lead" ? "flex flex-col" : "hidden lg:flex"
      )}>
        {!current ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Phone className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">Pick a lead</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">Helio orders your queue by score, temperature, and time-of-day fit. Click any lead on the left.</p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{current.name}</h2>
                    <Badge className={cn(TEMP_COLORS[current.temperature])}>{current.temperature}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{current.title} · {current.company}</div>
                </div>
                <LocalTime timezone={current.timezone} city={current.city} state={current.state} />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${current.phone}`} className="hover:underline font-mono">{formatPhone(current.phone)}</a></div>
                <div className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`mailto:${current.email}`} className="hover:underline truncate">{current.email}</a></div>
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />{current.service_interest}</div>
                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{current.industry}</div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-gradient-to-r from-primary to-indigo-500" size="lg" onClick={() => setQuickOpen(true)}>
                  <Phone className="h-4 w-4 mr-1.5" /> Log Attempt
                </Button>
                <Button variant="outline" size="lg" onClick={goNext}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Pinned notes</h4>
                {current.notes ? <p className="text-sm leading-relaxed">{current.notes}</p>
                  : <p className="text-sm text-muted-foreground">No pinned notes yet.</p>}
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Quick metrics</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/40 p-2.5"><div className="text-[10px] text-muted-foreground">Attempts</div><div className="text-lg font-semibold">{current.attempts}</div></div>
                  <div className="rounded-md bg-muted/40 p-2.5"><div className="text-[10px] text-muted-foreground">Status</div><div className={cn("inline-flex text-xs font-medium px-1.5 py-0.5 rounded mt-1", STATUS_COLORS[current.status])}>{current.status}</div></div>
                  <div className="rounded-md bg-muted/40 p-2.5"><div className="text-[10px] text-muted-foreground">Score</div><div className="text-lg font-mono font-semibold">{scoreLead(current, settings.scoring, settings.call_window_start, settings.call_window_end)}</div></div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Side: tabs */}
      <Card className={cn(
        "lg:col-span-4 lg:flex lg:flex-col overflow-hidden",
        mobilePane === "extras" ? "flex flex-col h-[70vh]" : "hidden lg:flex"
      )}>
        {!current ? <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Pick a lead first</div> : (
          <Tabs defaultValue="history" className="flex flex-col h-full">
            <TabsList className="m-3 mb-0 grid grid-cols-3">
              <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1" />History</TabsTrigger>
              <TabsTrigger value="notes"><MessageSquare className="h-3.5 w-3.5 mr-1" />Notes</TabsTrigger>
              <TabsTrigger value="scripts"><FileText className="h-3.5 w-3.5 mr-1" />Scripts</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="flex-1 overflow-y-auto p-4 m-0">
              {currentHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {currentHistory.map((h) => (
                    <div key={h.id} className="flex gap-2.5">
                      <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0",
                        h.disposition === "Answered" || h.disposition === "Qualified" ? "bg-emerald-500"
                        : h.disposition === "Not Interested" || h.disposition === "Wrong Number" ? "bg-rose-500"
                        : h.disposition === "Callback Requested" ? "bg-amber-500"
                        : "bg-muted-foreground/40"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium truncate">{h.disposition || h.type}</span>
                          <span className="text-xs text-muted-foreground">{relativeTime(h.created_at)}</span>
                        </div>
                        {h.note && <div className="text-xs text-muted-foreground mt-0.5">{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 m-0">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a note about this lead…" rows={4} />
              <Button size="sm" className="mt-2 w-full" onClick={saveNote} disabled={!note.trim()}>Save Note</Button>
            </TabsContent>

            <TabsContent value="scripts" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="space-y-3">
                {SCRIPTS.map((s) => (
                  <div key={s.title} className="rounded-md border bg-muted/20 p-3">
                    <div className="text-xs font-semibold mb-1.5">{s.title}</div>
                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{fill(s.body, current)}</p>
                    <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => { navigator.clipboard.writeText(fill(s.body, current)); toast.success("Script copied"); }}>Copy</Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Card>

      <QuickLogModal open={quickOpen} onOpenChange={setQuickOpen} lead={current} />
    </div>
    </div>
  );
}
