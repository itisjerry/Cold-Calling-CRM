"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalTime } from "@/components/leads/local-time";
import { QuickLogModal } from "@/components/leads/quick-log-modal";
import { cn, formatPhone, formatMoney, relativeTime, TEMP_COLORS, STATUS_COLORS } from "@/lib/utils";
import { Phone, Mail, Building, MapPin, Briefcase, ArrowLeft, MessageSquare, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const updateLead = useStore((s) => s.updateLead);
  const deleteLead = useStore((s) => s.deleteLead);
  const addHistory = useStore((s) => s.addHistory);

  const lead = leads.find((l) => l.id === params.id);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lead not found.</p>
        <Button variant="link" onClick={() => router.push("/leads")}>Back to leads</Button>
      </div>
    );
  }

  const leadHistory = history.filter((h) => h.lead_id === lead.id).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  const saveNote = () => {
    if (!note.trim()) return;
    addHistory({ lead_id: lead.id, type: "note", note });
    updateLead(lead.id, { notes: note });
    setNote("");
    toast.success("Note added");
  };

  // Fall back to the leads list if we landed here directly (no browser history).
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/leads");
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl break-words">{lead.name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-0.5 break-words">{lead.title} · {lead.company}</div>
              </div>
              <Badge className={cn(TEMP_COLORS[lead.temperature], "shrink-0")}>{lead.temperature}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 min-w-0"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{formatPhone(lead.phone)}</span></div>
            <div className="flex items-center gap-2 min-w-0"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{lead.email || "—"}</span></div>
            <div className="flex items-center gap-2 min-w-0"><Building className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{lead.industry || "—"}</span></div>
            <div className="flex items-center gap-2 min-w-0"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" /><LocalTime timezone={lead.timezone} city={lead.city} state={lead.state} compact /></div>
            <div className="flex items-center gap-2 min-w-0"><Briefcase className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{lead.service_interest || "—"}</span></div>
            <div className="pt-3 border-t grid grid-cols-2 gap-3">
              <div><div className="text-xs text-muted-foreground">Status</div><div className={cn("inline-flex mt-1 rounded-md px-2 py-0.5 text-xs font-medium", STATUS_COLORS[lead.status])}>{lead.status}</div></div>
              <div><div className="text-xs text-muted-foreground">Attempts</div><div className="text-base font-semibold mt-1">{lead.attempts}</div></div>
              <div><div className="text-xs text-muted-foreground">Source</div><div className="text-sm mt-1">{lead.source || "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Budget</div><div className="text-sm mt-1">{formatMoney(lead.budget)}</div></div>
            </div>
            <div className="flex gap-2 pt-3">
              <Button className="flex-1" onClick={() => setQuickOpen(true)}><Phone className="h-4 w-4 mr-1.5" /> Log Call</Button>
              <Button variant="outline" onClick={() => { if (confirm("Delete this lead?")) { deleteLead(lead.id); router.push("/leads"); }}}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Add a note</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a note about this lead — what happened, what's the next move?" rows={3} />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={saveNote} disabled={!note.trim()}><MessageSquare className="h-4 w-4 mr-1.5" /> Save Note</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              {leadHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">No activity yet. Log your first call to populate history.</div>
              ) : (
                <div className="space-y-3">
                  {leadHistory.map((h) => (
                    <div key={h.id} className="flex gap-3">
                      <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0",
                        h.disposition === "Answered" || h.disposition === "Qualified" ? "bg-emerald-500"
                        : h.disposition === "Not Interested" || h.disposition === "Wrong Number" ? "bg-rose-500"
                        : h.disposition === "Callback Requested" ? "bg-amber-500"
                        : "bg-muted-foreground/40"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{h.disposition || h.type}</span>
                          <span className="text-xs text-muted-foreground">{relativeTime(h.created_at)}</span>
                        </div>
                        {h.note && <div className="text-sm text-muted-foreground mt-0.5">{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <QuickLogModal open={quickOpen} onOpenChange={setQuickOpen} lead={lead} />
    </div>
  );
}
