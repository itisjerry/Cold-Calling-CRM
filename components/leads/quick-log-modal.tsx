"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lead, Disposition, LeadTemp } from "@/types";
import { toast } from "sonner";
import {
  Check, Phone, PhoneMissed, PhoneOff, Voicemail, Clock, Star, Send, X, AlertTriangle, CalendarClock, Sparkles,
} from "lucide-react";
import { celebrate } from "@/components/motion/confetti";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; lead: Lead | null; }

const DISPOSITIONS: Array<{
  value: Disposition;
  icon: any;
  tone: string;
  key: string;
  short: string;
}> = [
  { value: "Answered",           icon: Check,        tone: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30",     key: "1", short: "Picked up — chat begins" },
  { value: "Voicemail",          icon: Voicemail,    tone: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/30",                     key: "2", short: "Left a voicemail" },
  { value: "No Answer",          icon: PhoneMissed,  tone: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20 border-zinc-500/30", key: "3", short: "Rang out, no pickup" },
  { value: "Busy",               icon: PhoneOff,     tone: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20 border-zinc-500/30", key: "4", short: "Line was busy" },
  { value: "Callback Requested", icon: Clock,        tone: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30",            key: "5", short: "Asked us to call back" },
  { value: "Qualified",          icon: Star,         tone: "bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30",            key: "6", short: "🎯 Qualified — kicks pipeline" },
  { value: "Send Info",          icon: Send,         tone: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/30",        key: "7", short: "Send info, follow up" },
  { value: "Not Interested",     icon: X,            tone: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/30",                key: "8", short: "Hard no — capture reason" },
  { value: "Wrong Number",       icon: AlertTriangle,tone: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/30",        key: "9", short: "Bad number — retire lead" },
];

function formatDateTime(iso: string, tz?: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz ?? undefined,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export function QuickLogModal({ open, onOpenChange, lead }: Props) {
  const router = useRouter();
  const logCallAttempt = useStore((s) => s.logCallAttempt);

  const [selected, setSelected] = React.useState<Disposition | null>(null);
  const [note, setNote] = React.useState("");
  const [behavior, setBehavior] = React.useState("");
  const [callback, setCallback] = React.useState("");
  const [newTemp, setNewTemp] = React.useState<string>("");

  React.useEffect(() => {
    if (open) { setSelected(null); setNote(""); setBehavior(""); setCallback(""); setNewTemp(""); }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const d = DISPOSITIONS.find((x) => x.key === e.key);
      if (d) { setSelected(d.value); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!lead) return null;

  const requiresCallback = selected === "Callback Requested";
  const requiresReason = selected === "Not Interested";

  const save = () => {
    if (!selected) {
      toast.error("Pick a disposition first");
      return;
    }
    if (requiresCallback && !callback) {
      toast.error("Set a callback time");
      return;
    }
    if (requiresReason && !behavior.trim()) {
      toast.error("Add a brief reason for Not Interested");
      return;
    }

    const result = logCallAttempt({
      lead_id: lead.id,
      disposition: selected,
      note: note || null,
      behavior_note: behavior || null,
      callback_at: callback ? new Date(callback).toISOString() : null,
      new_temperature: (newTemp || null) as LeadTemp | null,
      not_interested_reason: requiresReason ? behavior : null,
    });

    if (selected === "Qualified") {
      celebrate();
      toast.success(`🎉 ${lead.name} qualified!`, { description: "Pipeline branch active." });
    } else if (selected === "Not Interested") {
      toast.success(`${lead.name} filed under Not Interested`, {
        description: "Reason saved. They're out of active rotation.",
        action: { label: "View", onClick: () => router.push("/not-interested") },
      });
    } else if (result.sandboxed) {
      toast.warning(`${lead.name} moved to Sandbox`, { description: "10 attempts reached — review for revival." });
    } else if (result.next_attempt_at) {
      toast.success(`Logged: ${selected}`, {
        description: `Next attempt ${formatDateTime(result.next_attempt_at, lead.timezone)}`,
      });
    } else {
      toast.success(`Logged: ${selected}`, { description: result.rationale });
    }
    onOpenChange(false);
  };

  // Live preview of what the algorithm will do
  const preview = React.useMemo(() => {
    if (!selected) return null;
    if (selected === "Qualified") return "→ Qualified, pipeline started, no auto re-attempt.";
    if (selected === "Not Interested") return "→ Filed under Not Interested with the reason you provide.";
    if (selected === "Wrong Number") return "→ Lead retired (Dead).";
    if (selected === "Answered") return "→ Connected, conversation begins. Plan the next step yourself.";
    if (selected === "Send Info") return "→ Info sent — auto-rescheduled in ~48 hours, time-shifted.";
    if (selected === "Callback Requested") return "→ Honors your callback time below.";
    if (selected === "Busy") return "→ Auto-rescheduled in ~2 hours (rotated time-of-day).";
    if (selected === "No Answer") return "→ Auto-rescheduled in ~5 hours (rotated time-of-day).";
    if (selected === "Voicemail") return "→ Auto-rescheduled in ~22 hours (rotated time-of-day).";
    return null;
  }, [selected]);

  const sandboxWarning = lead.attempts >= 9;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Log attempt
            <Badge variant="outline" className="ml-auto tabular-nums">
              {lead.name} · attempt #{lead.attempts + 1}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {sandboxWarning && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              This will be attempt <b>#{lead.attempts + 1}</b> of 10. After 10 the lead moves to Sandbox unless they engage.
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Disposition · press 1–9
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DISPOSITIONS.map((d) => {
                const Icon = d.icon;
                const active = selected === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelected(d.value)}
                    className={cn(
                      "relative flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-fast ease-ios",
                      "active:scale-[0.985]",
                      d.tone,
                      active && "ring-2 ring-primary scale-[0.99] shadow-elevation-2",
                    )}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div>{d.value}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{d.short}</div>
                    </div>
                    <kbd className="absolute top-1 right-1 rounded bg-background/70 px-1 text-[10px] font-mono">{d.key}</kbd>
                  </button>
                );
              })}
            </div>
          </div>

          {preview && (
            <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-primary">Auto-schedule:</span> <span className="text-foreground/80">{preview}</span>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Behavior note · {requiresReason ? <span className="text-rose-500">required</span> : "optional"}</Label>
              <Textarea
                rows={3}
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder={requiresReason ? "Why aren't they interested? (logged on the lead)" : "How did they sound? Any signal? Decision-maker?"}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Quick call note (optional)</Label>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Commitments, key points discussed…"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                Callback {requiresCallback ? <span className="text-rose-500">required</span> : "(optional override)"}
              </Label>
              <div className="relative mt-1.5">
                <CalendarClock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="datetime-local"
                  value={callback}
                  onChange={(e) => setCallback(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Update temperature</Label>
              <Select value={newTemp} onValueChange={setNewTemp}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="— keep current —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot">🔥 Hot</SelectItem>
                  <SelectItem value="Warm">🌤️ Warm</SelectItem>
                  <SelectItem value="Cold">❄️ Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="min-w-[140px]">
            Log & schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
