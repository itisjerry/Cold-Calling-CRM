"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { autoMap, parseCsv, applyMapping, dedup } from "@/lib/csv";
import { toast } from "sonner";
import type { Lead } from "@/types";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";

const LEAD_FIELDS: (keyof Lead | "ignore")[] = [
  "ignore", "name", "company", "title", "email", "phone",
  "city", "state", "country", "industry", "service_interest",
  "source", "notes",
];

export default function ImportPage() {
  const router = useRouter();
  const leads = useStore((s) => s.leads);
  const addLeadsBulk = useStore((s) => s.addLeadsBulk);
  const loadSample = useStore((s) => s.loadSampleData);

  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, keyof Lead | "ignore">>({});
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const { headers, rows } = await parseCsv(file);
      setHeaders(headers);
      setRows(rows);
      setMapping(autoMap(headers));
      toast.success(`Parsed ${rows.length} rows from ${file.name}`);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't parse file");
    }
  };

  const stats = React.useMemo(() => {
    if (!rows.length) return null;
    const incoming = applyMapping(rows, mapping);
    const { unique, duplicates } = dedup(incoming, leads);
    return { incoming, unique, duplicates };
  }, [rows, mapping, leads]);

  const confirmImport = () => {
    if (!stats) return;
    if (stats.unique.length === 0) {
      toast.error("Nothing new to import — all rows were duplicates.");
      return;
    }
    const n = addLeadsBulk(stats.unique);
    toast.success(`Imported ${n} new leads · ${stats.duplicates.length} duplicates skipped`);
    setRows([]); setHeaders([]); setMapping({});
    router.push("/leads");
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Leads</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Drop a CSV. We'll auto-map columns, resolve timezones, and skip duplicates.</p>
      </div>

      {!rows.length && (
        <Card
          className={`border-2 border-dashed transition-colors ${dragOver ? "border-primary bg-primary/5" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Drop your CSV here</h3>
            <p className="text-sm text-muted-foreground mt-1">Required: <span className="font-mono">name</span>, <span className="font-mono">phone</span>. Recommended: company, email, city, state.</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => inputRef.current?.click()}><FileSpreadsheet className="h-4 w-4 mr-1.5" />Choose File</Button>
              <Button variant="outline" onClick={() => { loadSample(); toast.success("Demo data loaded"); router.push("/leads"); }}>Load demo data</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Map columns</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {headers.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground w-24 truncate font-mono">{h}</div>
                    <Select value={mapping[h] ?? "ignore"} onValueChange={(v) => setMapping({ ...mapping, [h]: v as any })}>
                      <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEAD_FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {stats && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Preview</CardTitle>
                <div className="flex gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="h-4 w-4" /><span className="font-semibold">{stats.unique.length}</span> new</div>
                  <div className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="h-4 w-4" /><span className="font-semibold">{stats.duplicates.length}</span> duplicates</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground border-b">
                      <tr>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Company</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-left p-2">City</th>
                        <th className="text-left p-2">Timezone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stats.unique.slice(0, 25).map((l) => ({ ...l, _dup: false })), ...stats.duplicates.slice(0, 10).map((l) => ({ ...l, _dup: true }))].map((l: any, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-2">{l._dup ? <span className="text-amber-600">dup</span> : <span className="text-emerald-600">new</span>}</td>
                          <td className="p-2">{l.name}</td>
                          <td className="p-2">{l.company}</td>
                          <td className="p-2 font-mono">{l.phone}</td>
                          <td className="p-2">{l.city}</td>
                          <td className="p-2 text-muted-foreground">{l.timezone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => { setRows([]); setHeaders([]); setMapping({}); }}>Cancel</Button>
                  <Button onClick={confirmImport} disabled={stats.unique.length === 0}>Import {stats.unique.length} unique leads</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
