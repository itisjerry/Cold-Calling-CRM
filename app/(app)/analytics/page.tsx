"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7", "#06b6d4", "#10b981"];

export default function AnalyticsPage() {
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);

  const activity = React.useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const end = start + 86400000;
      const calls = history.filter((h) => h.type === "call" && +new Date(h.created_at) >= start && +new Date(h.created_at) < end).length;
      const connects = history.filter((h) => h.type === "call" && (h.disposition === "Answered" || h.disposition === "Qualified") && +new Date(h.created_at) >= start && +new Date(h.created_at) < end).length;
      out.push({ d: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }), calls, connects });
    }
    return out;
  }, [history]);

  const dispoData = React.useMemo(() => {
    const map = new Map<string, number>();
    history.filter((h) => h.type === "call").forEach((h) => map.set(h.disposition || "Unknown", (map.get(h.disposition || "Unknown") ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [history]);

  const funnel = ["New","Attempting","Connected","In Discussion","Qualified"].map((s) => ({
    stage: s, count: leads.filter((l) => l.status === s).length,
  }));

  const hours = React.useMemo(() => {
    const buckets = new Array(24).fill(0);
    const connects = new Array(24).fill(0);
    history.filter((h) => h.type === "call").forEach((h) => {
      const hr = new Date(h.created_at).getHours();
      buckets[hr]++;
      if (h.disposition === "Answered" || h.disposition === "Qualified") connects[hr]++;
    });
    return buckets.map((c, i) => ({
      hour: `${i}:00`,
      connectRate: c > 0 ? Math.round((connects[i] / c) * 100) : 0,
    }));
  }, [history]);

  // Weekly / monthly summary
  const week = computeSummary(history, 7);
  const month = computeSummary(history, 30);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Trends, conversion, effort over time. All derived from your call activity.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Activity (30 days)</CardTitle></CardHeader>
          <div className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="connects" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Disposition mix</CardTitle></CardHeader>
          <div className="p-4 pt-0 flex items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dispoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 10 }}>
                  {dispoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Status funnel</CardTitle></CardHeader>
          <div className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Best hours to connect</CardTitle></CardHeader>
          <div className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hours}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="connectRate" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SummaryCard title="This week" data={week} />
        <SummaryCard title="This month" data={month} />
      </div>
    </div>
  );
}

function computeSummary(history: any[], days: number) {
  const cutoff = Date.now() - days * 86400000;
  const calls = history.filter((h) => h.type === "call" && +new Date(h.created_at) >= cutoff);
  const answered = calls.filter((h) => h.disposition === "Answered").length;
  const voicemail = calls.filter((h) => h.disposition === "Voicemail").length;
  const noAnswer = calls.filter((h) => h.disposition === "No Answer").length;
  const callbacks = calls.filter((h) => h.disposition === "Callback Requested").length;
  const qualified = calls.filter((h) => h.disposition === "Qualified").length;
  const notInt = calls.filter((h) => h.disposition === "Not Interested").length;
  return { total: calls.length, answered, voicemail, noAnswer, callbacks, qualified, notInt };
}

function SummaryCard({ title, data }: { title: string; data: any }) {
  const rate = data.total > 0 ? Math.round(((data.answered + data.qualified) / data.total) * 100) : 0;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <div className="p-4 pt-0">
        <div className="text-3xl font-bold">{data.total} <span className="text-sm font-normal text-muted-foreground">calls</span></div>
        <div className="text-sm text-emerald-600 font-medium">{rate}% connect rate</div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
          <Stat label="Answered" val={data.answered} />
          <Stat label="Voicemail" val={data.voicemail} />
          <Stat label="No Answer" val={data.noAnswer} />
          <Stat label="Callbacks" val={data.callbacks} />
          <Stat label="Qualified" val={data.qualified} />
          <Stat label="Not Int." val={data.notInt} />
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, val }: { label: string; val: number }) {
  return (
    <div className="rounded-md bg-muted/40 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{val}</div>
    </div>
  );
}
