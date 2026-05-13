"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore, useAgents } from "@/lib/store";
import { toast } from "sonner";
import { Send, Shuffle, UserPlus } from "lucide-react";
import { initials } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** preselected lead ids; if empty, you can also pick from a quick search */
  leadIds?: string[];
}

export function PushLeadDialog({ open, onOpenChange, leadIds = [] }: Props) {
  const agents = useAgents();
  const assignLead = useStore((s) => s.assignLead);
  const assignLeadsBulk = useStore((s) => s.assignLeadsBulk);
  const roundRobinAssign = useStore((s) => s.roundRobinAssign);
  const leads = useStore((s) => s.leads);

  const [mode, setMode] = React.useState<"single" | "round-robin">("single");
  const [agentId, setAgentId] = React.useState<string>(agents[0]?.id ?? "");
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setMode(leadIds.length > 1 ? "round-robin" : "single");
      setAgentId(agents[0]?.id ?? "");
      setSelectedAgents(agents.map((a) => a.id));
      setNote("");
    }
  }, [open, leadIds.length, agents]);

  const targetLeads = leads.filter((l) => leadIds.includes(l.id));

  const submit = () => {
    if (leadIds.length === 0) {
      toast.error("Select at least one lead first");
      return;
    }
    if (mode === "single") {
      if (!agentId) return toast.error("Pick an agent");
      if (leadIds.length === 1) {
        assignLead(leadIds[0], agentId, note || undefined);
      } else {
        assignLeadsBulk(leadIds, agentId);
      }
      const agent = agents.find((a) => a.id === agentId);
      toast.success(`Pushed ${leadIds.length} lead${leadIds.length > 1 ? "s" : ""} to ${agent?.full_name}`);
    } else {
      if (selectedAgents.length === 0) return toast.error("Pick at least one agent");
      roundRobinAssign(leadIds, selectedAgents);
      toast.success(`Distributed ${leadIds.length} leads round-robin across ${selectedAgents.length} agents`);
    }
    onOpenChange(false);
  };

  const toggle = (id: string) => {
    setSelectedAgents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Push lead{leadIds.length > 1 ? `s (${leadIds.length})` : ""} to agent
          </DialogTitle>
        </DialogHeader>

        {targetLeads.length > 0 && (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs max-h-24 overflow-y-auto">
            {targetLeads.slice(0, 6).map((l) => (
              <div key={l.id} className="truncate">
                <span className="font-medium">{l.name}</span>
                {l.company && <span className="text-muted-foreground"> · {l.company}</span>}
              </div>
            ))}
            {targetLeads.length > 6 && (
              <div className="text-muted-foreground mt-1">+ {targetLeads.length - 6} more</div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "single" ? "default" : "outline"}
            onClick={() => setMode("single")}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" /> Single agent
          </Button>
          <Button
            size="sm"
            variant={mode === "round-robin" ? "default" : "outline"}
            onClick={() => setMode("round-robin")}
            disabled={leadIds.length < 2}
          >
            <Shuffle className="h-3.5 w-3.5 mr-1.5" /> Round-robin
          </Button>
        </div>

        {mode === "single" ? (
          <div className="space-y-3">
            <div>
              <Label>Assign to</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick an agent" /></SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note for agent (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1.5" placeholder="e.g. Priority — call before end of day" />
            </div>
          </div>
        ) : (
          <div>
            <Label>Distribute across</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {agents.map((a) => (
                <label key={a.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
                  <Checkbox checked={selectedAgents.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
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
            <div className="text-xs text-muted-foreground mt-2">
              {selectedAgents.length > 0
                ? `${leadIds.length} leads will be distributed across ${selectedAgents.length} agents (~${Math.ceil(leadIds.length / selectedAgents.length)} each).`
                : "Pick at least one agent."}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Push</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
