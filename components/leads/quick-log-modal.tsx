"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lead, Disposition, LeadStatus, LeadTemp } from "@/types";
import { toast } from "sonner";
import { Check, Phone, PhoneMissed, PhoneOff, Voicemail, Clock, Star, Send, X, AlertTriangle } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; lead: Lead | null; }

const DISPOSITIONS: Array<{ value: Disposition; icon: any; tone: string; statusEffect?: LeadStatus; key: string }> = [
  { value: "Answered",           icon: Check,        tone: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20",    statusEffect: "Connected",    key: "1" },
  { value: "Voicemail",          icon: Voicemail,    tone: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20",                  statusEffect: "Attempting",   key: "2" },
  { value: "No Answer",          icon: PhoneMissed,  tone: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/20 border-zinc-500/20", statusEffect: "Attempting", key: "3" },
  { value: "Busy",               icon: PhoneOff,     tone: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/20 border-zinc-500/20", statusEffect: "Attempting", key: "4" },
  { value: "Callback Requested", icon: Clock,        tone: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20",          statusEffect: "Follow-up",    key: "5" },
  { value: "Qualified",          icon: Star,         tone: "bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30",          statusEffect: "Qualified",    key: "6" },
  { value: "Send Info",          icon: Send,         tone: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20",      statusEffect: "In Discussion", key: "7" },
  { value: "Not Interested",     icon: X,            tone: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20",              statusEffect: "Not Interested", key: "8" },
  { value: "Wrong Number",       icon: AlertTriangle, tone: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20",     statusEffect: "Dead",         key: "9" },
];

export function QuickLogModal({ open, onOpenChange, lead }: Props) {
  const addHistory = useStore((s) => s.addHistory);
  const updateLead = useStore((s) => s.updateLead);

  const [selected, setSelected] = React.useState<Disposition | null>(null);
  const [note, setNote] = React.useState("");
  const [callback, setCallback] = React.useState("");
  const [newTemp, setNewTemp] = React.useState<string>("");

  React.useEffect(() => {
    if (open) { setSelected(null); setNote(""); setCallback(""); setNewTemp(""); }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const d = DISPOSITIONS.find((x) => x.key === e.key);
      if (d) { setSelected(d.value); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!lead) return null;

  const save = () => {
    if (!selected) {
      toast.error("Pick a disposition first");
      return;
    }
    const def = DISPOSITIONS.find((d) => d.value === selected)!;
    addHistory({ lead_id: lead.id, type: "call", disposition: selected, note: note || null });
    const patch: any = {};
    if (def.statusEffect) patch.status = def.statusEffect;
    if (callback) patch.next_callback_at = new Date(callback).toISOString();
    if (newTemp) patch.temperature = newTemp as LeadTemp;
    if (Object.keys(patch).length) updateLead(lead.id, patch);
    toast.success(`Logged: ${selected}`, { description: lead.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Log attempt
            <Badge variant="outline" className="ml-auto">{lead.name}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Disposition · press 1–9</div>
            <div className="grid grid-cols-3 gap-2">
              {DISPOSITIONS.map((d) => {
                const Icon = d.icon;
                const active = selected === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelected(d.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      d.tone,
                      active && "ring-2 ring-primary scale-[0.98]"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {d.value}
                    <kbd className="ml-auto rounded bg-background/60 px-1 text-[10px] font-mono">{d.key}</kbd>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Quick note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? Commitments? Decision-maker?" className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Schedule callback</Label>
              <Input type="datetime-local" value={callback} onChange={(e) => setCallback(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Update temperature</Label>
              <Select value={newTemp} onValueChange={setNewTemp}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="— keep current —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save Attempt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
