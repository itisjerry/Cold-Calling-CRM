"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function AddLeadDialog({ open, onOpenChange }: Props) {
  const addLead = useStore((s) => s.addLead);
  const [form, setForm] = React.useState({
    name: "", company: "", title: "", email: "", phone: "",
    city: "", state: "", country: "US", industry: "",
    service_interest: "Web Dev", source: "Manual",
    temperature: "Warm", status: "New", notes: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    addLead(form as any);
    toast.success(`Added ${form.name}`);
    onOpenChange(false);
    setForm({ name: "", company: "", title: "", email: "", phone: "", city: "", state: "", country: "US", industry: "", service_interest: "Web Dev", source: "Manual", temperature: "Warm", status: "New", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add a lead</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
          <div><Label>Company</Label><Input value={form.company} onChange={(e) => update("company", e.target.value)} /></div>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
          <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <div><Label>City</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
          <div><Label>State</Label><Input value={form.state} onChange={(e) => update("state", e.target.value)} /></div>
          <div>
            <Label>Service Interest</Label>
            <Select value={form.service_interest} onValueChange={(v) => update("service_interest", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Web Dev", "Branding", "E-com", "SEO", "Marketing", "Design"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Temperature</Label>
            <Select value={form.temperature} onValueChange={(v) => update("temperature", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Hot", "Warm", "Cold"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
