"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeChip } from "@/components/views/date-range-chip";
import { useStore } from "@/lib/store";
import { aggregateReport, REPORT_TEMPLATE_META, type ReportTemplate, type ReportFilters } from "@/lib/reports";
import type { DateRange } from "@/types";
import { FileText, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { initials, formatMoney } from "@/lib/utils";

interface Props {
  /** force the report to be scoped to a single agent (agent self-service) */
  forceAgentId?: string;
  /** preset agent (admin coming from drill-in) */
  initialAgentId?: string;
}

export function ReportBuilder({ forceAgentId, initialAgentId }: Props) {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const users = useStore((s) => s.users);
  const settings = useStore((s) => s.settings);
  const currentUserId = useStore((s) => s.currentUserId);
  const branding = settings.branding ?? {};

  const me = users.find((u) => u.id === currentUserId);
  const isAdmin = me?.role === "admin";

  const [template, setTemplate] = React.useState<ReportTemplate>("weekly-performance");
  const [range, setRange] = React.useState<DateRange>({ preset: "last_7_days" });

  const agents = users.filter((u) => u.role === "agent");
  const initialAgents: string[] = forceAgentId
    ? [forceAgentId]
    : initialAgentId
      ? [initialAgentId]
      : [];

  const [agentIds, setAgentIds] = React.useState<string[]>(initialAgents);

  React.useEffect(() => {
    // when forced to self, lock to current user
    if (forceAgentId) setAgentIds([forceAgentId]);
  }, [forceAgentId]);

  const sources = React.useMemo(
    () => Array.from(new Set(leads.map((l) => l.source ?? "Unknown"))).sort(),
    [leads]
  );

  const [sourceIds, setSourceIds] = React.useState<string[]>([]);
  const [tempIds, setTempIds] = React.useState<string[]>([]);
  const [statusIds, setStatusIds] = React.useState<string[]>([]);

  const filters: ReportFilters = {
    agentIds: agentIds.length > 0 ? agentIds : null,
    sources: sourceIds.length > 0 ? sourceIds : null,
    statuses: statusIds.length > 0 ? statusIds : null,
    tempFilter: tempIds.length > 0 ? tempIds : null,
  };

  const data = React.useMemo(
    () => aggregateReport({ template, range, filters, leads, history, projects, tasks, users }),
    [template, range, filters.agentIds, filters.sources, filters.statuses, filters.tempFilter, leads, history, projects, tasks, users]
  );

  const [generating, setGenerating] = React.useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { ReportDocument } = await import("@/lib/pdf-document");
      const blob = await pdf(
        <ReportDocument
          data={data}
          branding={branding}
          preparedBy={me?.full_name ?? "Helio CRM"}
          preparedByEmail={me?.email}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fn = `${(branding.org_name ?? "Pixel-Architecture").replace(/\s+/g, "-")}-${REPORT_TEMPLATE_META[template].label.replace(/\s+/g, "-")}-${data.range.start.toISOString().slice(0, 10)}_${data.range.end.toISOString().slice(0, 10)}.pdf`;
      a.href = url;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded", { description: fn });
    } catch (err: any) {
      console.error(err);
      toast.error("PDF generation failed", { description: String(err?.message ?? err) });
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Builder controls */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Report builder</CardTitle>
        </CardHeader>
        <div className="p-4 pt-0 space-y-4">
          <div>
            <Label>Template</Label>
            <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(REPORT_TEMPLATE_META) as ReportTemplate[]).map((k) => (
                  <SelectItem key={k} value={k}>{REPORT_TEMPLATE_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              {REPORT_TEMPLATE_META[template].description}
            </p>
          </div>

          <div>
            <Label>Date range</Label>
            <div className="mt-1.5">
              <DateRangeChip value={range} onChange={setRange} />
            </div>
          </div>

          {!forceAgentId && isAdmin && (
            <div>
              <Label>Agents</Label>
              <div className="mt-1.5 space-y-1 max-h-44 overflow-y-auto rounded-md border p-2">
                {agents.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                    <Checkbox checked={agentIds.includes(a.id)} onCheckedChange={() => toggle(agentIds, setAgentIds, a.id)} />
                    <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: a.avatar_color }}>{initials(a.full_name)}</span>
                    <span>{a.full_name}</span>
                  </label>
                ))}
                <div className="text-[10px] text-muted-foreground pt-1.5 border-t mt-1.5">
                  {agentIds.length === 0 ? "All agents included." : `${agentIds.length} agent(s) selected.`}
                </div>
              </div>
            </div>
          )}

          {forceAgentId && (
            <div className="rounded-md bg-muted/40 p-2 text-xs">
              Scoped to your data only.
            </div>
          )}

          <div>
            <Label>Sources</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-1 max-h-32 overflow-y-auto rounded-md border p-2">
              {sources.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={sourceIds.includes(s)} onCheckedChange={() => toggle(sourceIds, setSourceIds, s)} />
                  <span className="truncate">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Temperatures</Label>
            <div className="flex gap-2 mt-1.5">
              {["Hot", "Warm", "Cold"].map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={tempIds.includes(t)} onCheckedChange={() => toggle(tempIds, setTempIds, t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={generatePdf}
            disabled={generating}
          >
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {generating ? "Generating PDF…" : "Download branded PDF"}
          </Button>

          <div className="text-[10px] text-muted-foreground text-center">
            PDF will use the branding from Settings → Branding.
          </div>
        </div>
      </Card>

      {/* Live preview */}
      <div className="lg:col-span-2 space-y-3">
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Preview</div>
                <div className="text-lg font-bold mt-0.5">{REPORT_TEMPLATE_META[template].label}</div>
              </div>
              <Badge variant="outline">{data.range.label}</Badge>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Mini label="Dials"        value={data.totals.dials} />
              <Mini label="Connects"     value={data.totals.connects} sub={`${data.totals.connectRate}%`} />
              <Mini label="Qualified"    value={data.totals.qualified} />
              <Mini label="Callbacks"    value={data.totals.callbacksBooked} />
              <Mini label="Hot leads"    value={data.totals.hotLeads} />
              <Mini label="Total leads"  value={data.totals.totalLeads} />
              <Mini label="Pipeline $"   value={formatMoney(data.totals.pipelineValue)} />
              <Mini label="Avg attempts" value={data.totals.avgAttempts} />
            </div>

            {data.byAgent.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Per-agent</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left py-1.5 font-medium">Agent</th>
                        <th className="text-left py-1.5 font-medium">Dials</th>
                        <th className="text-left py-1.5 font-medium">Conn.</th>
                        <th className="text-left py-1.5 font-medium">Rate</th>
                        <th className="text-left py-1.5 font-medium">Qual.</th>
                        <th className="text-left py-1.5 font-medium">CB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byAgent.slice(0, 10).map((r) => (
                        <tr key={r.user.id} className="border-b">
                          <td className="py-1.5">{r.user.full_name}</td>
                          <td className="py-1.5">{r.dials}</td>
                          <td className="py-1.5">{r.connects}</td>
                          <td className="py-1.5">{r.rate}%</td>
                          <td className="py-1.5">{r.qualified}</td>
                          <td className="py-1.5">{r.callbacks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data.byDisposition.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Disposition mix</div>
                <div className="space-y-1">
                  {data.byDisposition.slice(0, 7).map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-xs">
                      <span className="w-32 truncate">{d.label}</span>
                      <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                        <div className="h-2 bg-primary" style={{ width: `${Math.min(100, d.pct)}%` }} />
                      </div>
                      <span className="text-muted-foreground w-16 text-right">{d.count} · {d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-md bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
