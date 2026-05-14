"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import {
  LayoutDashboard, Phone, Users, RotateCcw, GitBranch, Briefcase,
  CheckSquare, Calendar, BarChart3, Upload, Settings, Sparkles,
  Shield, Activity, Trophy, FileText, Bell, Inbox, UserCog,
  AlertTriangle, X as XIcon, MessageSquare,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useStore, useCurrentUser, useIsAdmin, useUnreadMessageCount } from "@/lib/store";
import { callWindowState } from "@/lib/timezones";
import { bucketLead } from "@/lib/lead-scheduler";

const AGENT_NAV = [
  { section: "Today", items: [
    { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { href: "/call-mode",  label: "Call Mode",  icon: Phone, live: true },
    { href: "/follow-ups", label: "Follow-ups", icon: RotateCcw },
    { href: "/inbox",      label: "Inbox",      icon: Inbox, badge: "updates" as const },
    { href: "/messages",   label: "Messages",   icon: MessageSquare, badge: "messages" as const },
  ]},
  { section: "Leads", items: [
    { href: "/leads",            label: "My Leads",       icon: Users, scope: "mine" as const },
    { href: "/sandbox",          label: "Sandbox",        icon: AlertTriangle, badge: "sandbox" as const },
    { href: "/not-interested",   label: "Not Interested", icon: XIcon, badge: "ni" as const },
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
  { section: "Account", items: [
    { href: "/settings",   label: "Settings",   icon: Settings },
  ]},
];

const ADMIN_NAV = [
  { section: "Command", items: [
    { href: "/admin",            label: "Admin Dashboard", icon: Shield },
    { href: "/call-mode",        label: "Call Mode",       icon: Phone, live: true },
    { href: "/admin/users",      label: "Users",           icon: UserCog },
    { href: "/admin/leads",      label: "All Leads",       icon: Users },
    { href: "/admin/projects",   label: "All Projects",    icon: Briefcase },
    { href: "/admin/activity",   label: "Activity",        icon: Activity },
    { href: "/admin/leaderboard",label: "Leaderboard",     icon: Trophy },
    { href: "/admin/reports",    label: "Reports",         icon: FileText },
  ]},
  { section: "Lead pools", items: [
    { href: "/sandbox",          label: "Sandbox",        icon: AlertTriangle, badge: "sandbox" as const },
    { href: "/not-interested",   label: "Not Interested", icon: XIcon, badge: "ni" as const },
  ]},
  { section: "Communicate", items: [
    { href: "/messages",   label: "Messages",   icon: MessageSquare, badge: "messages" as const },
    { href: "/inbox",      label: "Inbox",      icon: Inbox },
  ]},
  { section: "Workspace", items: [
    { href: "/pipeline",   label: "Pipeline",   icon: GitBranch },
    { href: "/projects",   label: "Projects",   icon: Briefcase },
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
  const unreadMessages = useUnreadMessageCount();

  const liveCount = React.useMemo(() => {
    const pool = isAdmin ? leads : myLeads;
    return pool.filter((l) =>
      callWindowState(l.timezone, settings.call_window_start, settings.call_window_end) === "in"
      && !["Dead", "Not Interested", "Qualified"].includes(l.status)
      && !l.sandboxed
    ).length;
  }, [leads, myLeads, settings, isAdmin]);

  const sandboxCount = React.useMemo(() => {
    const pool = isAdmin ? leads : myLeads;
    return pool.filter((l) => bucketLead(l) === "sandbox").length;
  }, [leads, myLeads, isAdmin]);

  const niCount = React.useMemo(() => {
    const pool = isAdmin ? leads : myLeads;
    return pool.filter((l) => l.status === "Not Interested").length;
  }, [leads, myLeads, isAdmin]);

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
    if (slot === "sandbox") return sandboxCount;
    if (slot === "ni") return niCount;
    if (slot === "messages") return unreadMessages;
    return 0;
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-border/60">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cold text-primary-foreground font-bold shadow-elevation-2 shadow-inner-hl">
          <span className="relative z-10">H</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-display text-sm font-semibold leading-none tracking-tight">
            Helio <span className="text-muted-foreground/80 font-normal">CRM</span>
          </span>
          <span className="text-[10px] text-muted-foreground leading-none mt-1 truncate">
            {isAdmin ? "Admin Console" : "Calling Command Center"}
          </span>
        </div>
      </div>

      <LayoutGroup id="sidebar-nav">
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {nav.map((sec) => (
            <div key={sec.section}>
              <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{sec.section}</div>
              <div className="space-y-0.5">
                {sec.items.map((item: any) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                  const Icon = item.icon;
                  const liveBadge = item.live && liveCount > 0;
                  const count = badgeFor(item.badge);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-base ease-ios",
                        active
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-md bg-primary/10 shadow-inner-hl"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-md bg-transparent group-hover:bg-accent transition-colors duration-base" />
                      )}
                      <Icon className="relative h-4 w-4 shrink-0" />
                      <span className="relative flex-1">{item.label}</span>
                      {liveBadge && (
                        <span className="relative inline-flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold h-5 min-w-[1.25rem] px-1.5 tabular-nums">
                          {liveCount}
                        </span>
                      )}
                      {count > 0 && (
                        <span className="relative inline-flex items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-semibold h-5 min-w-[1.25rem] px-1.5 tabular-nums">
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
      </LayoutGroup>

      <div className="border-t border-border/60 p-3 space-y-2">
        <div className="flex items-center gap-2 rounded-md p-2 hover:bg-accent transition-colors duration-base">
          {currentUser ? (
            <span
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-elevation-1 shadow-inner-hl"
              style={{ background: currentUser.avatar_color }}
            >
              {initials(currentUser.full_name)}
            </span>
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cold shadow-elevation-1" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{currentUser?.full_name ?? "Guest"}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {currentUser?.role === "admin" ? "Admin" : "Agent"}
            </div>
          </div>
        </div>
        <a
          href="https://www.pixelarchitecture.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[10px] text-muted-foreground/70 hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-accent/40"
        >
          Powered by{" "}
          <span className="font-semibold bg-gradient-to-r from-primary to-cold bg-clip-text text-transparent">
            Pixel Architecture
          </span>
        </a>
      </div>
    </aside>
  );
}
