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
import { CheckSquare } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId?: string;
  projectId?: string;
  preselectedAgentId?: string;
}

export function AssignTaskDialog({ open, onOpenChange, leadId, projectId, preselectedAgentId }: Props) {
  const agents = useAgents();
  const addTask = useStore((s) => s.addTask);

  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [due, setDue] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium");
  const [agentId, setAgentId] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDesc("");
      setDue("");
      setPriority("medium");
      setAgentId(preselectedAgentId ?? agents[0]?.id ?? "");
    }
  }, [open, preselectedAgentId, agents]);

  const submit = () => {
    if (!title.trim()) return toast.error("Add a task title");
    if (!agentId) return toast.error("Pick an agent");
    addTask({
      title,
      description: desc || null,
      due_at: due ? new Date(due).toISOString() : null,
      priority,
      user_id: agentId,
      lead_id: leadId ?? null,
      project_id: projectId ?? null,
    });
    const agent = agents.find((a) => a.id === agentId);
    toast.success(`Task assigned to ${agent?.full_name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" /> Create task & assign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="What needs to get done?" />
          </div>
          <div>
            <Label>Details (optional)</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due</Label>
              <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create & assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
