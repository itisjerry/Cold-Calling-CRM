"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, useAgents } from "@/lib/store";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { initials } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId?: string;
  projectId?: string;
  preselectedAgentId?: string;
}

export function SendReminderDialog({ open, onOpenChange, leadId, projectId, preselectedAgentId }: Props) {
  const agents = useAgents();
  const addReminder = useStore((s) => s.addReminder);

  const [message, setMessage] = React.useState("");
  const [firesAt, setFiresAt] = React.useState("");
  const [multi, setMulti] = React.useState<string[]>([]);
  const [single, setSingle] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setMessage("");
      // default fire at 1h from now
      const d = new Date(Date.now() + 60 * 60 * 1000);
      setFiresAt(d.toISOString().slice(0, 16));
      setSingle(preselectedAgentId ?? agents[0]?.id ?? "");
      setMulti(preselectedAgentId ? [preselectedAgentId] : []);
    }
  }, [open, preselectedAgentId, agents]);

  const submit = () => {
    if (!message.trim()) return toast.error("Reminder message is required");
    if (!firesAt) return toast.error("Set when this should fire");

    const recipients = multi.length > 0 ? multi : single ? [single] : [];
    if (recipients.length === 0) return toast.error("Pick at least one recipient");

    recipients.forEach((uid) => {
      addReminder({
        user_id: uid,
        message,
        fires_at: new Date(firesAt).toISOString(),
        lead_id: leadId ?? null,
        project_id: projectId ?? null,
      });
    });
    toast.success(`Reminder sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`);
    onOpenChange(false);
  };

  const toggle = (id: string) => {
    setMulti((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Send reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1.5" placeholder="What should they be reminded of?" />
          </div>
          <div>
            <Label>Fires at</Label>
            <Input type="datetime-local" value={firesAt} onChange={(e) => setFiresAt(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Recipients</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {agents.map((a) => (
                <label key={a.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                  <Checkbox checked={multi.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: a.avatar_color }}
                  >
                    {initials(a.full_name)}
                  </span>
                  <span className="text-sm truncate">{a.full_name}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Or pick one quickly:</div>
            <Select value={single} onValueChange={(v) => { setSingle(v); setMulti([]); }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Single recipient" /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Send reminder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
