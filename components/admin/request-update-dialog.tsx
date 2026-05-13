"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, useAgents } from "@/lib/store";
import { toast } from "sonner";
import { MessageCircleQuestion } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId?: string;
  projectId?: string;
  preselectedAgentId?: string;
}

export function RequestUpdateDialog({ open, onOpenChange, leadId, projectId, preselectedAgentId }: Props) {
  const agents = useAgents();
  const createUpdateRequest = useStore((s) => s.createUpdateRequest);
  const leads = useStore((s) => s.leads);
  const projects = useStore((s) => s.projects);

  const [agentId, setAgentId] = React.useState<string>("");
  const [question, setQuestion] = React.useState("");
  const [due, setDue] = React.useState("");
  const [selectedLead, setSelectedLead] = React.useState<string>(leadId ?? "");
  const [selectedProject, setSelectedProject] = React.useState<string>(projectId ?? "");

  React.useEffect(() => {
    if (open) {
      // default due to 24h from now
      const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setDue(d.toISOString().slice(0, 16));
      setQuestion("");
      setSelectedLead(leadId ?? "");
      setSelectedProject(projectId ?? "");

      // try to auto-pick the agent based on the linked lead's owner
      if (leadId) {
        const lead = leads.find((l) => l.id === leadId);
        if (lead?.owner_id) {
          setAgentId(lead.owner_id);
          return;
        }
      }
      setAgentId(preselectedAgentId ?? agents[0]?.id ?? "");
    }
  }, [open, leadId, projectId, preselectedAgentId, agents, leads]);

  const submit = () => {
    if (!question.trim()) return toast.error("Type a question");
    if (!agentId) return toast.error("Pick an agent");
    createUpdateRequest({
      agent_id: agentId,
      lead_id: selectedLead || null,
      project_id: selectedProject || null,
      question,
      due_at: due ? new Date(due).toISOString() : null,
    });
    const agent = agents.find((a) => a.id === agentId);
    toast.success(`Update requested from ${agent?.full_name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-primary" /> Request an update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>From</Label>
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
            <Label>Your question</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="mt-1.5"
              placeholder="e.g. Where are we with this lead? Did we book the callback yet?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lead (optional)</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">— none —</SelectItem>
                  {leads.slice(0, 100).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project (optional)</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">— none —</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Reply due by</Label>
            <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1.5" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
