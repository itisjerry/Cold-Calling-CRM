"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const updateBranding = useStore((s) => s.updateBranding);
  const loadSample = useStore((s) => s.loadSampleData);
  const wipe = useStore((s) => s.wipe);

  const [local, setLocal] = React.useState(settings);
  React.useEffect(() => setLocal(settings), [settings]);
  const onChange = (patch: any) => setLocal({ ...local, ...patch });

  const save = () => {
    updateSettings(local);
    toast.success("Settings saved");
  };

  // Custom dispositions
  const dispositions = local.dispositions ?? [];
  const [newDispo, setNewDispo] = React.useState("");
  const addDispo = () => {
    if (!newDispo.trim()) return;
    onChange({ dispositions: [...dispositions, newDispo.trim()] });
    setNewDispo("");
  };
  const removeDispo = (d: string) => onChange({ dispositions: dispositions.filter((x) => x !== d) });

  // Custom pipeline stages
  const stages = local.pipeline_stages ?? [];
  const [newStage, setNewStage] = React.useState("");
  const addStage = () => {
    if (!newStage.trim()) return;
    onChange({ pipeline_stages: [...stages, newStage.trim()] });
    setNewStage("");
  };
  const removeStage = (s: string) => onChange({ pipeline_stages: stages.filter((x) => x !== s) });

  // Branding
  const branding = local.branding ?? {};
  const setBrand = (patch: any) => onChange({ branding: { ...branding, ...patch } });

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBrand({ logoDataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tune the engine that runs your day.</p>
        </div>
        <Button onClick={save}>Save settings</Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding & PDF</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="grid md:grid-cols-2 gap-4">
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
                <div><Label>Boost Tue/Thu follow-ups</Label><p className="text-xs text-muted-foreground">Boosts follow-up scores on these days.</p></div>
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
        </TabsContent>

        <TabsContent value="branding" className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Organization branding</CardTitle></CardHeader>
            <div className="p-5 pt-0 space-y-3">
              <div><Label>Organization name</Label>
                <Input value={branding.org_name ?? ""} onChange={(e) => setBrand({ org_name: e.target.value })} placeholder="Pixel Architecture" className="mt-1.5" /></div>
              <div>
                <Label>Logo</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  {branding.logoDataUrl ? (
                    <img src={branding.logoDataUrl} alt="logo" className="h-12 w-12 rounded-md object-contain border" />
                  ) : (
                    <div className="h-12 w-12 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </span>
                  </label>
                  {branding.logoDataUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setBrand({ logoDataUrl: null })}>Remove</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">PNG/SVG, transparent background works best.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Primary</Label>
                  <Input type="color" value={branding.primary_color ?? "#4f46e5"} onChange={(e) => setBrand({ primary_color: e.target.value })} className="mt-1.5 h-9 p-1" /></div>
                <div><Label className="text-xs">Accent</Label>
                  <Input type="color" value={branding.accent_color ?? "#0ea5e9"} onChange={(e) => setBrand({ accent_color: e.target.value })} className="mt-1.5 h-9 p-1" /></div>
                <div><Label className="text-xs">Ink</Label>
                  <Input type="color" value={branding.ink_color ?? "#0f172a"} onChange={(e) => setBrand({ ink_color: e.target.value })} className="mt-1.5 h-9 p-1" /></div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">PDF report defaults</CardTitle></CardHeader>
            <div className="p-5 pt-0 space-y-3">
              <div><Label>Footer text</Label>
                <Input value={branding.footer_text ?? ""} onChange={(e) => setBrand({ footer_text: e.target.value })} className="mt-1.5" placeholder="Pixel Architecture — Confidential" /></div>
              <div><Label>Signed off by — name</Label>
                <Input value={branding.signature_name ?? ""} onChange={(e) => setBrand({ signature_name: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Signed off by — title</Label>
                <Input value={branding.signature_title ?? ""} onChange={(e) => setBrand({ signature_title: e.target.value })} className="mt-1.5" /></div>
              <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded" style={{ background: branding.primary_color ?? "#4f46e5" }} />
                  <span className="font-medium">{branding.org_name ?? "Pixel Architecture"}</span>
                </div>
                <div className="text-muted-foreground">{branding.footer_text ?? "Confidential"}</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customize" className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Call dispositions</CardTitle></CardHeader>
            <div className="p-5 pt-0 space-y-2">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {dispositions.map((d) => (
                  <div key={d} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
                    <span className="flex-1">{d}</span>
                    <button onClick={() => removeDispo(d)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newDispo} onChange={(e) => setNewDispo(e.target.value)} placeholder="Add disposition…" onKeyDown={(e) => e.key === "Enter" && addDispo()} />
                <Button size="sm" onClick={addDispo}><Plus className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">Changes here update report and admin views. The Call Mode quick-log keeps its default set.</p>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pipeline stages</CardTitle></CardHeader>
            <div className="p-5 pt-0 space-y-2">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {stages.map((s) => (
                  <div key={s} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
                    <span className="flex-1">{s}</span>
                    <button onClick={() => removeStage(s)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Add stage…" onKeyDown={(e) => e.key === "Enter" && addStage()} />
                <Button size="sm" onClick={addStage}><Plus className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">Pixel Architecture and Takeoff can have different stage flows.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="scoring">
          <Card>
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
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Danger zone</CardTitle></CardHeader>
            <div className="p-5 pt-0 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { loadSample(); toast.success("Sample data reloaded"); }}>Reload sample data</Button>
              <Button variant="destructive" onClick={() => { if (confirm("Wipe all leads, history, tasks, and projects?")) { wipe(); toast.success("Wiped"); } }}>
                <Trash2 className="h-4 w-4 mr-1" /> Wipe all data
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
