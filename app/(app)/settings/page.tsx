"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const loadSample = useStore((s) => s.loadSampleData);
  const wipe = useStore((s) => s.wipe);

  const [local, setLocal] = React.useState(settings);
  const onChange = (patch: any) => setLocal({ ...local, ...patch });

  const save = () => {
    updateSettings(local);
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tune the engine that runs your day.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Calling window</CardTitle></CardHeader>
          <div className="p-5 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start hour (lead's local)</Label>
                <Input type="number" min={0} max={23} value={local.call_window_start} onChange={(e) => onChange({ call_window_start: Number(e.target.value) })} className="mt-1.5" /></div>
              <div><Label>End hour</Label>
                <Input type="number" min={0} max={23} value={local.call_window_end} onChange={(e) => onChange({ call_window_end: Number(e.target.value) })} className="mt-1.5" /></div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div><Label>Boost Tue/Thu follow-ups</Label><p className="text-xs text-muted-foreground">Industry best practice — boosts follow-up scores on these days.</p></div>
              <Switch checked={local.boost_tue_thu} onCheckedChange={(v) => onChange({ boost_tue_thu: v })} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Auto-revival</CardTitle></CardHeader>
          <div className="p-5 pt-0 space-y-3">
            <div><Label>Attempts before moving to Revival</Label>
              <Input type="number" value={local.revival_attempts} onChange={(e) => onChange({ revival_attempts: Number(e.target.value) })} className="mt-1.5" /></div>
            <div><Label>Days before "old" lead</Label>
              <Input type="number" value={local.old_days} onChange={(e) => onChange({ old_days: Number(e.target.value) })} className="mt-1.5" /></div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Lead scoring weights</CardTitle></CardHeader>
          <div className="p-5 pt-0 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              ["hot", "Hot weight"], ["warm", "Warm weight"], ["cold", "Cold weight"],
              ["recencyMax", "Recency max boost"], ["recencyDecayDays", "Recency decay (days)"],
              ["callbackToday", "Callback today boost"], ["callbackOverdue", "Callback overdue boost"],
              ["tueThuBoost", "Tue/Thu boost"], ["inWindowBoost", "In-window boost"],
              ["attemptPenalty", "Attempt penalty (each)"], ["staleAgePenalty", "Stale (>60d) penalty"],
            ].map(([k, l]) => (
              <div key={k}><Label>{l}</Label>
                <Input type="number" value={(local.scoring as any)[k]} onChange={(e) => onChange({ scoring: { ...local.scoring, [k]: Number(e.target.value) } })} className="mt-1.5" /></div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Danger zone</CardTitle></CardHeader>
          <div className="p-5 pt-0 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { loadSample(); toast.success("Sample data reloaded"); }}>Reload sample data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Wipe all leads, history, tasks, and projects?")) { wipe(); toast.success("Wiped"); } }}>Wipe all data</Button>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>Save settings</Button>
      </div>
    </div>
  );
}
