"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const leads = useStore((s) => s.leads);
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);

  const [cursor, setCursor] = React.useState(() => new Date());

  const month = cursor.getMonth();
  const year = cursor.getFullYear();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsForDay = (d: Date) => {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const end = start + 86400000;
    const items: { type: string; label: string; href?: string }[] = [];
    leads.forEach((l) => {
      if (l.next_callback_at) {
        const t = +new Date(l.next_callback_at);
        if (t >= start && t < end) items.push({ type: "callback", label: `Callback: ${l.name}`, href: `/leads/${l.id}` });
      }
    });
    tasks.forEach((t) => {
      if (t.due_at) {
        const ts = +new Date(t.due_at);
        if (ts >= start && ts < end) items.push({ type: "task", label: t.title, href: "/tasks" });
      }
    });
    projects.forEach((p) => {
      if (p.due_date) {
        const t = +new Date(p.due_date);
        if (t >= start && t < end) items.push({ type: "project", label: p.name });
      }
    });
    return items;
  };

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Callbacks, tasks, and project milestones.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-sm font-medium min-w-[120px] text-center">
            {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="p-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => (
            <div key={i} className={cn("min-h-[110px] border-b border-r p-1.5 last:border-r-0", !d && "bg-muted/30")}>
              {d && (
                <>
                  <div className={cn("text-xs font-medium mb-1", isToday(d) && "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground")}>{d.getDate()}</div>
                  <div className="space-y-0.5">
                    {eventsForDay(d).slice(0, 3).map((ev, j) => (
                      ev.href ? (
                        <Link key={j} href={ev.href} className={cn("block truncate text-[10px] px-1.5 py-0.5 rounded",
                          ev.type === "callback" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : ev.type === "task" ? "bg-primary/15 text-primary"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        )}>{ev.label}</Link>
                      ) : (
                        <div key={j} className="truncate text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">{ev.label}</div>
                      )
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
