"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Phone, Users, RotateCcw, GitBranch, Briefcase,
  CheckSquare, Calendar, BarChart3, Upload, Settings, Sparkles,
  Shield, Activity, Trophy, FileText, Bell, Inbox, UserCog,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useStore, useCurrentUser, useIsAdmin } from "@/lib/store";
import { scoreLead } from "@/lib/scoring";
import { callWindowState } from "@/lib/timezones";

const AGENT_NAV = [
  { section: "Workspace", items: [
    { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { href: "/call-mode",  label: "Call Mode",  icon: Phone, live: true },
    { href: "/leads",      label: "My Leads",   icon: Users, scope: "mine" as const },
    { href: "/follow-ups", label: "Follow-ups", icon: RotateCcw },
    { href: "/inbox",      label: "Inbox",      icon: Inbox, badge: "updates" as const },
  ]},
  { section: "Pipeline", items: [
    { href: "/pipeline",   label: "Pipeline",   icon: GitBranch },
    { href: "/projects",   label: "Projects",   icon: Briefcase },
  ]},
  { section: "Productivity", items: [
    { href: "/tasks",      label: "Tasks",      icon: CheckSquare, badge: "tasks" as const },
    { href: "/reminders",  label: "Reminders",  icon: Bell,        badge: "reminders" as const },
    { href: "/calendar",   label: "Calendar",   icon: Calendar },
    { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
    { href: "/reports",    label: "Reports",    icon: FileText },
  ]},
  { section: "Data", items: [
    { href: "/import",     label: "Import",     icon: Upload },
    { href: "/settings",   label: "Settings",   icon: Settings },
  ]},
];

const ADMIN_NAV = [
  { section: "Command", items: [
    { href: "/admin",            label: "Admin Dashboard", icon: Shield },
    { href: "/admin/users",      label: "Users",           icon: UserCog },
    { href: "/admin/leads",      label: "All Leads",       icon: Users },
    { href: "/admin/projects",   label: "All Projects",    icon: Briefcase },
    { href: "/admin/activity",   label: "Activity",        icon: Activity },
    { href: "/admin/leaderboard",label: "Leaderboard",     icon: Trophy },
    { href: "/admin/reports",    label: "Reports",         icon: FileText },
  ]},
  { section: "My workspace", items: [
    { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { href: "/call-mode",  label: "Call Mode",  icon: Phone },
    { href: "/leads",      label: "Leads",      icon: Users },
    { href: "/follow-ups", label: "Follow-ups", icon: RotateCcw },
    { href: "/pipeline",   label: "Pipeline",   icon: GitBranch },
    { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
    { href: "/reminders",  label: "Reminders",  icon: Bell },
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
  const isAdmin = useIsAdmin();
  const currentUser = useCurrentUser();
  const leads = useStore((s) => s.leads);
  const tasks = useStore((s) => s.tasks);
  const reminders = useStore((s) => s.reminders);
  const updateRequests = useStore((s) => s.updateRequests);
  const settings = useStore((s) => s.settings);

  const myId = currentUser?.id;
  const myLeads = React.useMemo(() => leads.filter((l) => l.owner_id === myId), [leads, myId]);

  const liveCount = React.useMemo(() => {
    const pool = isAdmin ? leads : myLeads;
    return pool.filter((l) =>
      callWindowState(l.timezone, settings.call_window_start, settings.call_window_end) === "in"
      && !["Dead", "Not Interested", "Qualified"].includes(l.status)
    ).length;
  }, [leads, myLeads, settings, isAdmin]);

  const openTasks = React.useMemo(
    () => tasks.filter((t) => !t.done && (isAdmin ? true : t.user_id === myId)).length,
    [tasks, isAdmin, myId]
  );
  const openReminders = React.useMemo(
    () => reminders.filter((r) => !r.done && r.user_id === myId).length,
    [reminders, myId]
  );
  const pendingUpdates = React.useMemo(
    () => updateRequests.filter((u) => u.status === "pending" && u.agent_id === myId).length,
    [updateRequests, myId]
  );

  const nav = isAdmin ? ADMIN_NAV : AGENT_NAV;

  const badgeFor = (slot?: string): number => {
    if (slot === "tasks") return openTasks;
    if (slot === "reminders") return openReminders;
    if (slot === "updates") return pendingUpdates;
    return 0;
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card/40">
      <div className="flex h-14 items-center gap-2 px-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cold text-primary-foreground font-bold">H</div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none">Helio</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
            {isAdmin ? "Admin Console" : "Calling Command Center"}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {nav.map((sec) => (
          <div key={sec.section}>
            <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{sec.section}</div>
            <div className="space-y-0.5">
              {sec.items.map((item: any) => {
                const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                const exactActive = pathname === item.href;
                const Icon = item.icon;
                const liveBadge = item.live && liveCount > 0;
                const count = badgeFor(item.badge);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      (active || exactActive)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {liveBadge && (
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold h-5 min-w-[1.25rem] px-1.5">
                        {liveCount}
                      </span>
                    )}
                    {count > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-semibold h-5 min-w-[1.25rem] px-1.5">
                        {count}
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
          {currentUser ? (
            <span
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: currentUser.avatar_color }}
            >
              {initials(currentUser.full_name)}
            </span>
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cold" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{currentUser?.full_name ?? "Guest"}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {currentUser?.role === "admin" ? "Admin" : "Agent"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
