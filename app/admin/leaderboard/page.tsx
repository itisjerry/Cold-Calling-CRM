"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore, useAgents } from "@/lib/store";
import { cn, initials } from "@/lib/utils";
import { Trophy, Phone, Star, TrendingUp, Flame } from "lucide-react";
import { DateRangeChip } from "@/components/views/date-range-chip";
import { resolveDateRange, withinRange } from "@/lib/date-range";
import type { DateRange } from "@/types";

export default function AdminLeaderboardPage() {
  const agents = useAgents();
  const leads = useStore((s) => s.leads);
  const history = useStore((s) => s.history);

  const [tab, setTab] = React.useState("week");
  const [range, setRange] = React.useState<DateRange>({ preset: "last_7_days" });

  // Override the range based on tab unless user explicitly customizes
  const tabRange: Record<string, DateRange> = {
    today: { preset: "today" },
    week: { preset: "last_7_days" },
    month: { preset: "last_30_days" },
    custom: range,
  };
  const activeRange = tab === "custom" ? range : tabRange[tab];
  const resolved = resolveDateRange(activeRange);

  const board = agents.map((a) => {
    const calls = history.filter(
      (h) => h.by_user === a.id && h.type === "call" && withinRange(h.created_at, resolved)
    );
    const connects = calls.filter((h) => h.disposition === "Answered" || h.disposition === "Qualified");
    const quals = calls.filter((h) => h.disposition === "Qualified").length;
    const cbBooked = calls.filter((h) => h.disposition === "Callback Requested").length;
    const myLeads = leads.filter((l) => l.owner_id === a.id);
    const hot = myLeads.filter((l) => l.temperature === "Hot").length;
    const pipelineVal = myLeads.reduce((s, l) => s + (l.budget ?? 0), 0);
    return {
      a,
      dials: calls.length,
      connects: connects.length,
      rate: calls.length > 0 ? Math.round((connects.length / calls.length) * 100) : 0,
      quals,
      cbBooked,
      hot,
      pipelineVal,
    };
  });

  // sort by quals desc, then by connects, then by dials
  const ranked = [...board].sort((a, b) => b.quals - a.quals || b.connects - a.connects || b.dials - a.dials);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" /> Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{resolved.label} · {ranked.length} agents</p>
        </div>
        {tab === "custom" && <DateRangeChip value={range} onChange={setRange} />}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This week</TabsTrigger>
          <TabsTrigger value="month">This month</TabsTrigger>
          <TabsTrigger value="custom">Custom range</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {/* Podium */}
          <div className="grid md:grid-cols-3 gap-3">
            {ranked.slice(0, 3).map((row, i) => (
              <Card key={row.a.id} className={cn(
                "p-4 relative overflow-hidden",
                i === 0 && "border-amber-400/40",
                i === 1 && "border-zinc-300",
                i === 2 && "border-orange-300/50"
              )}>
                <div className={cn(
                  "absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20",
                  i === 0 && "bg-amber-400",
                  i === 1 && "bg-zinc-400",
                  i === 2 && "bg-orange-500"
                )} />
                <div className="flex items-center gap-3">
                  <Trophy className={cn(
                    "h-8 w-8",
                    i === 0 && "text-amber-500",
                    i === 1 && "text-zinc-400",
                    i === 2 && "text-orange-700"
                  )} />
                  <Link href={`/admin/users/${row.a.id}`} className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">#{i + 1}</div>
                    <div className="font-semibold truncate hover:text-primary">{row.a.full_name}</div>
                  </Link>
                  <span className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: row.a.avatar_color }}>
                    {initials(row.a.full_name)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <Mini label="Dials" value={row.dials} icon={Phone} />
                  <Mini label="Connect" value={`${row.rate}%`} icon={TrendingUp} />
                  <Mini label="Qualified" value={row.quals} icon={Star} />
                </div>
              </Card>
            ))}
          </div>

          {/* Full table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Full standings</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b text-xs text-muted-foreground">
                    <th className="text-left p-3 font-medium w-12">#</th>
                    <th className="text-left p-3 font-medium">Agent</th>
                    <th className="text-left p-3 font-medium">Dials</th>
                    <th className="text-left p-3 font-medium">Connects</th>
                    <th className="text-left p-3 font-medium">Rate</th>
                    <th className="text-left p-3 font-medium">Qualified</th>
                    <th className="text-left p-3 font-medium">Callbacks</th>
                    <th className="text-left p-3 font-medium">Hot leads</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((row, i) => (
                    <tr key={row.a.id} className="border-b hover:bg-accent">
                      <td className={cn(
                        "p-3 font-mono",
                        i === 0 && "text-amber-500 font-bold",
                        i === 1 && "text-zinc-400 font-bold",
                        i === 2 && "text-orange-700 font-bold"
                      )}>#{i + 1}</td>
                      <td className="p-3">
                        <Link href={`/admin/users/${row.a.id}`} className="flex items-center gap-2 hover:text-primary">
                          <span className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: row.a.avatar_color }}>
                            {initials(row.a.full_name)}
                          </span>
                          <span className="font-medium">{row.a.full_name}</span>
                        </Link>
                      </td>
                      <td className="p-3">{row.dials}</td>
                      <td className="p-3">{row.connects}</td>
                      <td className={cn("p-3", row.rate >= 30 && "text-emerald-600 font-semibold")}>{row.rate}%</td>
                      <td className="p-3">{row.quals}</td>
                      <td className="p-3">{row.cbBooked}</td>
                      <td className="p-3 flex items-center gap-1">{row.hot > 0 && <Flame className="h-3 w-3 text-red-500" />} {row.hot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Mini({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground flex items-center justify-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
