"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/leads/local-time";
import { cn, isTueOrThu, TEMP_COLORS, relativeTime, daysSince, getLastDisposition } from "@/lib/utils";
import { Flame, Clock, Calendar as CalendarIcon, Zap, Voicemail, PhoneOff } from "lucide-react";

function LeadStrip({ lead }: { lead: any }) {
  return (
    <Link href={`/leads/${lead.id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-accent rounded-md transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{lead.name}</span>
          <Badge className={cn("text-[10px] px-1.5 py-0", TEMP_COLORS[lead.temperature])}>{lead.temperature}</Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate">{lead.company} · {lead.attempts}× tried</div>
      </div>
      <LocalTime timezone={lead.timezone} city={lead.city} state={lead.state} compact />
    </Link>
  );
}

export default function FollowupsPage() {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const settings = useStore((s) => s.settings);

  const openStatuses = ["Connected", "In Discussion", "Qualified", "Not Interested", "Dead"];

  const hotUnanswered = leads
    .filter((l) => l.temperature === "Hot" && l.attempts > 0 && !openStatuses.includes(l.status))
    .slice(0, 20);

  const callbacks = leads
    .filter((l) => l.next_callback_at)
    .sort((a, b) => +new Date(a.next_callback_at!) - +new Date(b.next_callback_at!))
    .slice(0, 20);

  const tueThu = isTueOrThu();
  const bestDay = leads
    .filter((l) => l.status === "Follow-up")
    .slice(0, 20);

  const revival = leads
    .filter((l) => l.attempts >= settings.revival_attempts && !["Qualified", "Won", "Dead", "Not Interested"].includes(l.status))
    .slice(0, 20);

  const voicemails = leads
    .filter((l) => !openStatuses.includes(l.status) && getLastDisposition(l.id, history) === "Voicemail")
    .slice(0, 20);

  const unanswered = leads
    .filter((l) => !openStatuses.includes(l.status) && getLastDisposition(l.id, history) === "No Answer")
    .slice(0, 20);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {tueThu ? <span className="text-emerald-600 font-medium">Tue/Thu boost active</span> : "Tue/Thu boost not active today"} · Hot unanswered leads at the top.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-red-500" /> Hot — Unanswered ({hotUnanswered.length})</CardTitle></CardHeader>
          <div className="p-2 pt-0 space-y-1 max-h-[520px] overflow-y-auto">
            {hotUnanswered.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">All hot leads have been reached.</p>
              : hotUnanswered.map((l) => <LeadStrip key={l.id} lead={l} />)}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Callbacks Due ({callbacks.length})</CardTitle></CardHeader>
          <div className="p-2 pt-0 space-y-1 max-h-[520px] overflow-y-auto">
            {callbacks.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">No callbacks scheduled.</p>
              : callbacks.map((l) => <LeadStrip key={l.id} lead={l} />)}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Today's Best Day ({bestDay.length})</CardTitle></CardHeader>
          <div className="p-2 pt-0 space-y-1 max-h-[520px] overflow-y-auto">
            {bestDay.map((l) => <LeadStrip key={l.id} lead={l} />)}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> Revival ({settings.revival_attempts}+ attempts) ({revival.length})</CardTitle></CardHeader>
          <div className="p-2 pt-0 space-y-1 max-h-[520px] overflow-y-auto">
            {revival.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">No revival candidates.</p>
              : revival.map((l) => <LeadStrip key={l.id} lead={l} />)}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Voicemail className="h-4 w-4 text-indigo-500" /> Voicemails left ({voicemails.length})</CardTitle></CardHeader>
          <div className="p-2 pt-0 space-y-1 max-h-[520px] overflow-y-auto">
            {voicemails.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">No voicemails awaiting a callback.</p>
              : voicemails.map((l) => <LeadStrip key={l.id} lead={l} />)}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><PhoneOff className="h-4 w-4 text-slate-500" /> Unanswered ({unanswered.length})</CardTitle></CardHeader>
          <div className="p-2 pt-0 space-y-1 max-h-[520px] overflow-y-auto">
            {unanswered.length === 0 ? <p className="p-4 text-sm text-muted-foreground text-center">No unanswered calls to retry.</p>
              : unanswered.map((l) => <LeadStrip key={l.id} lead={l} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}
