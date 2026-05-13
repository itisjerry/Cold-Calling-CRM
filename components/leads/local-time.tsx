"use client";
import * as React from "react";
import { localTime, callWindowState } from "@/lib/timezones";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Props { timezone?: string | null; city?: string | null; state?: string | null; compact?: boolean; }

export function LocalTime({ timezone, city, state, compact }: Props) {
  const settings = useStore((s) => s.settings);
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const time = localTime(timezone, now);
  const win = callWindowState(timezone, settings.call_window_start, settings.call_window_end);
  const dot = win === "in" ? "bg-emerald-500" : win === "edge" ? "bg-amber-500" : "bg-red-500";
  const label = win === "in" ? "In window" : win === "edge" ? "Edge" : "Off-hours";

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-mono")} title={label}>
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {time}
      </span>
    );
  }
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        {city}{state ? `, ${state}` : ""}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {time} · {label}
      </div>
    </div>
  );
}
