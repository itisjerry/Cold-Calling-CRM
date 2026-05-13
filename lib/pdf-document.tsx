"use client";
import * as React from "react";
import { Document, Page, View, Text, StyleSheet, Image, Svg, Path, Rect, Line, Circle, G } from "@react-pdf/renderer";
import type { ReportData, AgentRow } from "./reports";
import type { OrgBranding } from "@/types";
import { REPORT_TEMPLATE_META } from "./reports";

// ---- Styles ----
const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 28, height: 28, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
  },
  brandMarkText: { color: "white", fontSize: 12, fontWeight: 700 },
  brandName: { fontSize: 13, fontWeight: 700 },
  brandSub: { fontSize: 8, color: "#64748b" },
  reportLabel: { fontSize: 9, color: "#64748b", textAlign: "right" },
  reportTitle: { fontSize: 11, fontWeight: 700, textAlign: "right" },

  cover: { paddingTop: 80 },
  coverTitle: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  coverSub: { fontSize: 14, color: "#475569", marginBottom: 32 },
  coverMeta: { fontSize: 10, color: "#64748b", marginBottom: 4 },
  coverDateRange: {
    marginTop: 24, padding: 12, backgroundColor: "#f1f5f9",
    borderRadius: 6, borderLeftWidth: 3,
  },
  coverDateLabel: { fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
  coverDateValue: { fontSize: 14, fontWeight: 700, marginTop: 4 },

  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8, marginTop: 14 },
  sectionSubtitle: { fontSize: 9, color: "#64748b", marginBottom: 8 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  kpi: { width: "23%", padding: 8, backgroundColor: "#f8fafc", borderRadius: 4 },
  kpiLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  kpiSub: { fontSize: 7, color: "#94a3b8", marginTop: 1 },

  table: { marginBottom: 12 },
  tableHead: {
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#cbd5e1",
    paddingVertical: 4, backgroundColor: "#f8fafc",
  },
  tableRow: {
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
  },
  th: { fontSize: 8, fontWeight: 700, color: "#64748b", textTransform: "uppercase", paddingHorizontal: 4 },
  td: { fontSize: 9, paddingHorizontal: 4 },

  footer: {
    position: "absolute", bottom: 30, left: 40, right: 40,
    flexDirection: "row", justifyContent: "space-between",
    fontSize: 8, color: "#94a3b8",
    paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0",
  },
  legalBlock: { marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#e2e8f0", fontSize: 9, color: "#475569" },
});

interface DocProps {
  data: ReportData;
  branding: OrgBranding;
  preparedBy: string;
  preparedByEmail?: string;
}

export function ReportDocument({ data, branding, preparedBy, preparedByEmail }: DocProps) {
  const primary = branding.primary_color || "#4f46e5";
  const accent = branding.accent_color || "#0ea5e9";
  const orgName = branding.org_name || "Pixel Architecture";
  const meta = REPORT_TEMPLATE_META[data.template];

  return (
    <Document
      title={`${meta.label} — ${orgName}`}
      author={preparedBy}
      subject={`${meta.label} for ${data.range.label}`}
    >
      {/* Cover */}
      <Page size="A4" style={styles.page}>
        <Header brand={branding} primary={primary} reportTitle={meta.label} />
        <View style={styles.cover}>
          {branding.logoDataUrl ? (
            <Image src={branding.logoDataUrl} style={{ width: 60, height: 60, marginBottom: 24 }} />
          ) : null}
          <Text style={styles.coverSub}>{orgName}</Text>
          <Text style={styles.coverTitle}>{meta.label}</Text>
          <Text style={{ fontSize: 11, color: "#475569", marginBottom: 16, marginTop: 4 }}>
            {meta.description}
          </Text>

          <View style={[styles.coverDateRange, { borderLeftColor: primary }]}>
            <Text style={styles.coverDateLabel}>Report period</Text>
            <Text style={styles.coverDateValue}>{data.range.label}</Text>
          </View>

          <View style={{ marginTop: 30 }}>
            <Text style={styles.coverMeta}>Prepared by</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{preparedBy}</Text>
            {preparedByEmail && <Text style={{ fontSize: 9, color: "#64748b" }}>{preparedByEmail}</Text>}
            <Text style={[styles.coverMeta, { marginTop: 14 }]}>Generated</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>{new Date().toLocaleString()}</Text>
            <Text style={[styles.coverMeta, { marginTop: 14 }]}>Filters applied</Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>
              {summarizeFilters(data.filters)}
            </Text>
          </View>
        </View>
        <Footer brand={branding} primary={primary} />
      </Page>

      {/* KPIs + body */}
      <Page size="A4" style={styles.page}>
        <Header brand={branding} primary={primary} reportTitle={meta.label} />

        <Text style={styles.sectionTitle}>Headline numbers</Text>
        <View style={styles.kpiGrid}>
          <Kpi label="Total dials"     value={String(data.totals.dials)} />
          <Kpi label="Connects"        value={String(data.totals.connects)} sub={`${data.totals.connectRate}% rate`} />
          <Kpi label="Qualified"       value={String(data.totals.qualified)} sub="leads" />
          <Kpi label="Callbacks"       value={String(data.totals.callbacksBooked)} sub="booked" />
          <Kpi label="Voicemails"      value={String(data.totals.voicemails)} />
          <Kpi label="Not interested"  value={String(data.totals.notInterested)} />
          <Kpi label="Pipeline value"  value={fmtMoneyShort(data.totals.pipelineValue)} sub={`${data.totals.totalLeads} leads`} />
          <Kpi label="Hot leads"       value={String(data.totals.hotLeads)} sub={`avg ${data.totals.avgAttempts} attempts`} />
        </View>

        {data.byDay.length > 0 && data.byDay.length <= 31 && (
          <>
            <Text style={styles.sectionTitle}>Daily activity</Text>
            <DailyBarChart data={data.byDay} primary={primary} accent={accent} />
          </>
        )}

        {data.byDisposition.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Disposition mix</Text>
            <DispositionTable rows={data.byDisposition} primary={primary} />
          </>
        )}

        <Footer brand={branding} primary={primary} />
      </Page>

      {/* Per-agent + funnel page */}
      <Page size="A4" style={styles.page}>
        <Header brand={branding} primary={primary} reportTitle={meta.label} />

        {data.byAgent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Per-agent performance</Text>
            <Text style={styles.sectionSubtitle}>Ranked by qualified leads, then connects, then dials.</Text>
            <AgentTable rows={data.byAgent} primary={primary} />
          </>
        )}

        <Text style={styles.sectionTitle}>Pipeline funnel</Text>
        <FunnelChart funnel={data.funnel} primary={primary} accent={accent} />

        {data.bySource.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Lead source ROI</Text>
            <SourceTable rows={data.bySource} primary={primary} />
          </>
        )}

        <View style={styles.legalBlock}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>Signed off by</Text>
          <Text>{branding.signature_name || preparedBy}</Text>
          <Text style={{ color: "#64748b" }}>{branding.signature_title || "Founder"}</Text>
        </View>

        <Footer brand={branding} primary={primary} />
      </Page>

      {/* Best-hour heatmap + top leads */}
      <Page size="A4" style={styles.page}>
        <Header brand={branding} primary={primary} reportTitle={meta.label} />

        <Text style={styles.sectionTitle}>Best hours to call</Text>
        <Text style={styles.sectionSubtitle}>Hour-by-hour connect rate during the period.</Text>
        <HourHeatmap data={data.byHour} primary={primary} />

        {data.topLeads.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top leads to prioritize</Text>
            <TopLeadsTable rows={data.topLeads} primary={primary} />
          </>
        )}

        <Footer brand={branding} primary={primary} />
      </Page>
    </Document>
  );
}

// ---- Sub-components ----
function Header({ brand, primary, reportTitle }: { brand: OrgBranding; primary: string; reportTitle: string }) {
  return (
    <View style={styles.headerBar} fixed>
      <View style={styles.brandRow}>
        <View style={[styles.brandMark, { backgroundColor: primary }]}>
          <Text style={styles.brandMarkText}>{(brand.org_name ?? "PA").slice(0, 2).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.brandName}>{brand.org_name || "Pixel Architecture"}</Text>
          <Text style={styles.brandSub}>Helio CRM — Calling Command Center</Text>
        </View>
      </View>
      <View>
        <Text style={styles.reportLabel}>Report</Text>
        <Text style={styles.reportTitle}>{reportTitle}</Text>
      </View>
    </View>
  );
}

function Footer({ brand, primary }: { brand: OrgBranding; primary: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{brand.footer_text || `${brand.org_name || "Pixel Architecture"} — Confidential`}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function AgentTable({ rows, primary }: { rows: AgentRow[]; primary: string }) {
  const widths = [4, 2, 2, 1.5, 2, 2, 2];
  const headers = ["Agent", "Dials", "Connects", "Rate", "Qualified", "Callbacks", "Hot leads"];
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        {headers.map((h, i) => (
          <Text key={h} style={[styles.th, { flex: widths[i] }]}>{h}</Text>
        ))}
      </View>
      {rows.map((r, idx) => (
        <View key={r.user.id} style={styles.tableRow}>
          <Text style={[styles.td, { flex: widths[0] }]}>
            #{idx + 1}  {r.user.full_name}
          </Text>
          <Text style={[styles.td, { flex: widths[1] }]}>{r.dials}</Text>
          <Text style={[styles.td, { flex: widths[2] }]}>{r.connects}</Text>
          <Text style={[styles.td, { flex: widths[3], color: r.rate >= 30 ? "#059669" : "#0f172a" }]}>{r.rate}%</Text>
          <Text style={[styles.td, { flex: widths[4] }]}>{r.qualified}</Text>
          <Text style={[styles.td, { flex: widths[5] }]}>{r.callbacks}</Text>
          <Text style={[styles.td, { flex: widths[6] }]}>{r.hotLeads}</Text>
        </View>
      ))}
    </View>
  );
}

function DispositionTable({ rows, primary }: { rows: { label: string; count: number; pct: number }[]; primary: string }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        <Text style={[styles.th, { flex: 5 }]}>Disposition</Text>
        <Text style={[styles.th, { flex: 2 }]}>Count</Text>
        <Text style={[styles.th, { flex: 2 }]}>%</Text>
        <Text style={[styles.th, { flex: 4 }]}></Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 5 }]}>{r.label}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{r.count}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{r.pct}%</Text>
          <View style={{ flex: 4, justifyContent: "center" }}>
            <View style={{ height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
              <View style={{ width: `${Math.min(100, r.pct)}%`, height: 6, backgroundColor: primary }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function SourceTable({ rows, primary }: { rows: { label: string; total: number; qualified: number; conversion: number; value: number }[]; primary: string }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        <Text style={[styles.th, { flex: 4 }]}>Source</Text>
        <Text style={[styles.th, { flex: 2 }]}>Total</Text>
        <Text style={[styles.th, { flex: 2 }]}>Qualified</Text>
        <Text style={[styles.th, { flex: 2 }]}>Conv.</Text>
        <Text style={[styles.th, { flex: 3 }]}>Value</Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 4 }]}>{r.label}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{r.total}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{r.qualified}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{r.conversion}%</Text>
          <Text style={[styles.td, { flex: 3 }]}>{fmtMoneyShort(r.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function TopLeadsTable({ rows, primary }: { rows: any[]; primary: string }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        <Text style={[styles.th, { flex: 4 }]}>Name</Text>
        <Text style={[styles.th, { flex: 4 }]}>Company</Text>
        <Text style={[styles.th, { flex: 2 }]}>Temp</Text>
        <Text style={[styles.th, { flex: 2 }]}>Status</Text>
        <Text style={[styles.th, { flex: 2 }]}>Budget</Text>
        <Text style={[styles.th, { flex: 2 }]}>Attempts</Text>
      </View>
      {rows.map((l) => (
        <View key={l.id} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 4 }]}>{l.name}</Text>
          <Text style={[styles.td, { flex: 4 }]}>{l.company ?? "—"}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{l.temperature}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{l.status}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{fmtMoneyShort(l.budget)}</Text>
          <Text style={[styles.td, { flex: 2 }]}>{l.attempts}</Text>
        </View>
      ))}
    </View>
  );
}

function DailyBarChart({ data, primary, accent }: { data: { label: string; calls: number; connects: number }[]; primary: string; accent: string }) {
  const W = 515;
  const H = 130;
  const PAD = { top: 10, right: 10, bottom: 24, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(1, ...data.map((d) => d.calls));
  const barW = innerW / data.length;

  return (
    <Svg width={W} height={H}>
      {/* y axis grid */}
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <Line
          key={p}
          x1={PAD.left} x2={W - PAD.right}
          y1={PAD.top + innerH - innerH * p} y2={PAD.top + innerH - innerH * p}
          stroke="#e2e8f0" strokeWidth={0.5}
        />
      ))}
      {/* y axis labels */}
      {[0, 0.5, 1].map((p) => (
        <Text key={p} x={PAD.left - 4} y={PAD.top + innerH - innerH * p + 3} style={{ fontSize: 7, fill: "#94a3b8" }}>
          {Math.round(max * p)}
        </Text>
      ))}
      {data.map((d, i) => {
        const callsH = (d.calls / max) * innerH;
        const connH = (d.connects / max) * innerH;
        const x = PAD.left + i * barW;
        return (
          <G key={d.label}>
            <Rect x={x + 1} y={PAD.top + innerH - callsH} width={Math.max(2, barW * 0.65)} height={callsH} fill={primary} opacity={0.35} />
            <Rect x={x + 1} y={PAD.top + innerH - connH} width={Math.max(2, barW * 0.65)} height={connH} fill={primary} />
            {data.length <= 14 && (
              <Text x={x + barW / 2} y={H - 6} style={{ fontSize: 6, fill: "#64748b", textAnchor: "middle" }}>
                {d.label}
              </Text>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

function FunnelChart({ funnel, primary, accent }: { funnel: { stage: string; count: number }[]; primary: string; accent: string }) {
  const max = Math.max(1, ...funnel.map((f) => f.count));
  return (
    <View style={{ marginBottom: 10 }}>
      {funnel.map((f, i) => {
        const pct = Math.round((f.count / max) * 100);
        return (
          <View key={f.stage} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ width: 90, fontSize: 9 }}>{f.stage}</Text>
            <View style={{ flex: 1, height: 14, backgroundColor: "#f1f5f9", borderRadius: 3 }}>
              <View style={{ width: `${pct}%`, height: 14, backgroundColor: primary, borderRadius: 3 }} />
            </View>
            <Text style={{ width: 30, fontSize: 9, textAlign: "right" }}>{f.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

function HourHeatmap({ data, primary }: { data: { hour: number; calls: number; rate: number }[]; primary: string }) {
  const max = Math.max(1, ...data.map((d) => d.calls));
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {data.map((d) => {
          const intensity = d.calls / max;
          return (
            <View key={d.hour} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: 18, height: 30, borderRadius: 2,
                  backgroundColor: intensity > 0 ? primary : "#f1f5f9",
                  opacity: intensity > 0 ? Math.max(0.15, intensity) : 1,
                }}
              />
              <Text style={{ fontSize: 6, marginTop: 2, color: "#64748b" }}>{d.hour}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
        {data.map((d) => (
          <Text key={d.hour} style={{ flex: 1, fontSize: 6, textAlign: "center", color: "#94a3b8" }}>
            {d.rate}%
          </Text>
        ))}
      </View>
    </View>
  );
}

function summarizeFilters(f: ReportData["filters"]): string {
  const parts: string[] = [];
  if (f.agentIds && f.agentIds.length > 0) parts.push(`${f.agentIds.length} agent(s)`);
  else parts.push("All agents");
  if (f.sources && f.sources.length > 0) parts.push(`${f.sources.length} source(s)`);
  if (f.statuses && f.statuses.length > 0) parts.push(`${f.statuses.length} status(es)`);
  if (f.tempFilter && f.tempFilter.length > 0) parts.push(`${f.tempFilter.length} temp(s)`);
  return parts.join(" · ");
}

function fmtMoneyShort(n?: number | null): string {
  if (n == null || n === 0) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}
