"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Phone, Users, RotateCcw, GitBranch, Briefcase,
  CheckSquare, Calendar, BarChart3, Upload, Settings, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { scoreLead } from "@/lib/scoring";
import { callWindowState } from "@/lib/timezones";

const NAV = [
  { section: "Workspace", items: [
    { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { href: "/call-mode",  label: "Call Mode",  icon: Phone, live: true },
    { href: "/leads",      label: "Leads",      icon: Users },
    { href: "/follow-ups", label: "Follow-ups", icon: RotateCcw },
  ]},
  { section: "Pipeline", items: [
    { href: "/pipeline",   label: "Pipeline",   icon: GitBranch },
    { href: "/projects",   label: "Projects",   icon: Briefcase },
  ]},
  { section: "Productivity", items: [
    { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
    { href: "/calendar",   label: "Calendar",   icon: Calendar },
    { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
  ]},
  { section: "Data", items: [
    { href: "/import",     label: "Import",     icon: Upload },
    { href: "/settings",   label: "Settings",   icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const leads = useStore((s) => s.leads);
  const settings = useStore((s) => s.settings);

  const liveCount = React.useMemo(() => {
    return leads.filter((l) =>
      callWindowState(l.timezone, settings.call_window_start, settings.call_window_end) === "in"
      && !["Dead", "Not Interested", "Qualified"].includes(l.status)
    ).length;
  }, [leads, settings]);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card/40">
      <div className="flex h-14 items-center gap-2 px-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cold text-primary-foreground font-bold">H</div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none">Helio</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Calling Command Center</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((sec) => (
          <div key={sec.section}>
            <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{sec.section}</div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.live && liveCount > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold h-5 min-w-[1.25rem] px-1.5">
                        {liveCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-md p-2 hover:bg-accent">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cold flex items-center justify-center text-primary-foreground text-xs font-semibold">YM</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Caller</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Pro plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
